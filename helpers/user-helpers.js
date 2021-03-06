var db = require('../config/connection')
var collection = require('../config/collections')
var bcrypt = require('bcrypt')
const { response } = require('express')
var objectId = require('mongodb').ObjectID
const config = require('../config/config');
const client = require("twilio")(config.accountSID, config.authToken);

const Razorpay = require('razorpay')
const { resolve } = require('path')
var instance = new Razorpay({
    key_id: 'rzp_test_0ILyjTRt2BMx0R',

    key_secret: 'Qdbfz5c2WbikB73fVlTQkPks'

});

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {

            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {

                resolve(data.ops[0])

            })

        })


    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {

                bcrypt.compare(userData.Password, user.Password).then((status) => {

                    if (status) {
                        console.log("login success")
                        response.user = user
                        response.status = true
                        resolve(response)
                    }
                    else {
                        console.log("login failed")
                        resolve({ status: false })
                    }

                })

            } else {
                console.log("login failed")
                resolve({ status: false })
            }
        })
    },
  

    doMobileValidation: (mobile) => {
        console.log(mobile);
        return new Promise(async (resolve, reject) => {
          let user = await db.get().collection(collection.USER_COLLECTION)
            .findOne({ Mobile: mobile })
          if (user) {
            console.log(user);
            resolve({ available: true });
          } else {
            resolve({ available: false });
          }
    
        })
      },
      doSendOtp: (MobileNumber) => {
        return new Promise(async (resolve, reject) => {
          client.verify
            .services("VA8cd480f75d3e7d3f45949aa50a1f305f")
            .verifications.create({
              to: MobileNumber,
              channel: "sms",
            })
            .then((response) => {
              console.log(response);
              resolve(response)
    
            });
        })
      },
  
    doVerifyOtp: (mobileno, Otp) => {
        return new Promise(async (resolve, reject) => {
    
          let response = {};
          let user = await db.get().collection(collections.USER_COLLECTION)
            .findOne({ Mobile: mobileno });
          console.log(user);
          if (user) {
            client.verify
              .services("VA9c0ce9c2c2ac54d32e71606306e8ec55")
              .verificationChecks
              .create({
                to: mobileno,
                code: Otp
              }).then((data) => {
                console.log(data.status);
                if (data.status === "approved") {
                  console.log("login success");
                  response.user = user;
                  response.status = true;
                  console.log(response.user, response.status)
                  resolve(response);
                } else {
                  console.log("login failed 1");
                  resolve({ status: false });
                }
              });
          }
    
        })
      },
    
    removeCartItem: (details) => {
        db.get().collection(collection.CART_COLLECTION)
          .updateOne(
            {
              "user": objectId(details.user)
            },
            {
              $pull: { "cart.$[v].cartItems": { item: objectId(details.product) } }
    
            },
            {
              arrayFilters: [{ "v.vendorId": objectId(details.vendorId), }], multi: true
            }
          ).then((response) => {
            resolve({ removeProduct: true });
          })
      },
    
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await
                db.get().collection(collection.CART_COLLECTION)
                    .findOne({ user: objectId(userId) });
            if (userCart) {
                let proExist = userCart.products.findIndex((product) =>
                    product.item == proId
                );
                console.log(proExist);
                if (proExist != -1) {

                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne(
                            {
                                user: objectId(userId), "products.item":
                                    objectId(proId)
                            },
                            {
                                $inc: { "products.$.quantity": 1 }
                            }
                        ).then(() => {
                            resolve()
                        });


                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {

                                $push: { products: proObj }

                            }

                        ).then((response) => {
                            resolve()
                        })
                }


            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ["$product", 0] },


                    },
                },

            ]).toArray()
            console.log(cartItems[0])

            resolve(cartItems)

        });

    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length

            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }

                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {
                        resolve({ status: true })
                    })

            }
        })

    },
    getTotalAmount: (userId) => {

        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ["$product", 0] },


                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.Price'] } }
                    }

                }

            ]).toArray()
            // console.log(total[0].total)

            resolve(total[0].total)

        });
    },
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, total);
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode
                },
                userId: objectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                status: status,
                date: new Date()
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).removeOne({ user: objectId(order.userId) })
                resolve(response.ops[0]._id)
            })

        })

    },
    // getCartProductList: (userId) => {
    //     return new Promise(async (resolve, reject) => {
    //         let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
           
    //         console.log(cart);
    //         resolve(cart.products)
    //     })
    // },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
          // let products= await db.get().collection(collections.CART_COLLECTIONS).findOne({user:objectId(userId)})
          let products = await db.get().collection(collection.CART_COLLECTION).aggregate([
            {
              $match: { user: objectId(userId) },
            },
    
    
          ]).toArray();
          console.log("products", products);
          resolve(products[0].cart)
        })
      },
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId);
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({ userId: objectId(userId) }).toArray()
            console.log(orders);
            resolve(orders)

        })

    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'

                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'

                    }

                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }

                    }
                }

            ]).toArray()
            console.log(orderItems)
            resolve(orderItems)
        })
    },
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total*100,
                currency: "INR",
                // receipt: orderId.str
                receipt: ""+orderId



            };
            console.log("total", total)
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("new order", order);
                    resolve(order)
                }
            });
        })
    },
    getUserStatus: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            if (user.Status == "Active") {
                resolve({ UserStatus: "Active" })
            } else {
                resolve({ UserStatus: "Block" })
            }
        })

    },
    verifyPayment: (details) => {
                console.log("details-----------------------------------420", details);
                return new Promise((resolve, reject) => {
        
                    const crypto = require('crypto');
                    let hmac = crypto.createHmac('sha256', 'Qdbfz5c2WbikB73fVlTQkPks')
                    hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
                    hmac = hmac.digest('hex')
                    if (hmac == details['payment[razorpay_signature]']) {
                        resolve()
                    } else {
                        reject()
                    }
        
                })
            },
    changePaymentStatus: (orderId) => {
                console.log("changepayment", orderId)
                return new Promise((resolve, reject) => {
                    db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                        {
                            $set: {
                                status: 'placed'
        
                            }
                        }
                    ).then(() => {
                        resolve()
                    })
                })
 
           },

           updateProfile: (userId, userDetails) => {
                    return new Promise((resolve, reject) => {
                      db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                        $set: {
                          Name: userDetails.Name,
                          Email: userDetails.Email,
                          Mobile: userDetails.Mobile,
                        }
                      }).then((response) => {
                        resolve()
                      })
                    })
                  },
                  checkPassword: (userId, oldPassword) => {
                    return new Promise(async (resolve, reject) => {
                      let response = {};
                      let user = await db.get().collection(collection.USER_COLLECTION)
                        .findOne({ _id: objectId(userId) });
                      if (user) {
                        bcrypt.compare(oldPassword, user.Password).then((status) => {
                          if (status) {
                            console.log("login success");
                            response.status = true;
                            resolve(response);
                          } else {
                            console.log("login failed 1");
                            resolve({ status: false });
                          }
                        });
                      } else {
                        console.log("login failed 2");
                        resolve({ status: false });
                      }
                    })
                  },
                  resetPassword: (userId, newPassword) => {
                    return new Promise(async (resolve, reject) => {
                      newPassword = await bcrypt.hash(newPassword, 10);
                      await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                        $set: {
                          Password: newPassword
                        }
                      }).then(response)
                      resolve(response)
                    })
                  },
}