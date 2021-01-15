var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectID
var bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const { response } = require('express')

module.exports = {
    // addvendors:(vendor,callback)=>{

    //     console.log(vendor)
    //     db.get().collection('vendor').insertOne(vendor).then((data)=>{
    //         callback(data.ops[0]._id)



    //     })



    // },

    addvendors: (vendor) => {
        return new Promise(async (resolve, reject) => {

            console.log(vendor)
            vendor.Login_password = await bcrypt.hash(vendor.Login_password, 10)
            db.get().collection('vendor').insertOne(vendor).then((data) => {
                resolve(data.ops[0])
                console.log(vendor)
            })
        })
    },

    getAllvendors: () => {

        return new Promise(async (resolve, reject) => {

            let vendors = await db.get().collection(collection.VENDOR_COLLECTION).find({ Status: "Active" }).toArray()

            resolve(vendors)
        })
    },
    deletevendor: (vendorId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.VENDOR_COLLECTION).removeOne({ _id: objectId(vendorId) }).then((response) => {

                console.log(response)


                resolve(response)


            })
        })


    },

    getVendorsOrder: (vendorId) => {
        return new Promise(async (resolve, reject) => {
          let vendorOrder = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .aggregate([
              {
                $unwind: "$products",
              },
              {
                $match: { "products._id": objectId(vendorId) },
              },
              {
                $sort: { date: -1 },
              },
              {
                $project: {
                  _id: 1,
                  paymentMethod: 1,
                  products: 1,
                  date: { $dateToString: { format: "%d-%m-%Y", date: "$date" } },
                  deliveryDetails: 1,
                },
              },
            ])
            .toArray();
          console.log("vendorOrder", vendorOrder);
          resolve(vendorOrder);
        });
      },
      getOrderDetails: (orderId, vendorId) => {
        return new Promise(async (resolve, reject) => {
          let OrderDetails = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .aggregate([
              {
                $match: { _id: objectId(orderId) },
              },
              {
                $unwind: "$products",
              },
              {
                $match: { "products._id": objectId(vendorId) },
              },
            ])
            .toArray();
          console.log("vendorOrder", OrderDetails);
          resolve(OrderDetails[0]);
        });
      },
      updateOrderStatus: (orderId, status, vendorId) => {
        return new Promise((resolve, reject) => {
          db.get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne(
              {
                _id: objectId(orderId),
                "products._id": objectId(vendorId),
              },
              {
                $set: { "products.$.status": status },
              }
            );
        });
      },
    
      getSalesReport: (vendorId) => {
        return new Promise(async (resolve, reject) => {
          let sales = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .aggregate([
              {
                $unwind: "$products",
              },
              {
                $match: {
                  $and: [
                    { "products._id": objectId(vendorId) },
                    { "products.status": "Delivered" },
                  ],
                },
              },
              {
                $sort: { date: -1 },
              },
              {
                $project: {
                  orderId: "$_id",
                  vendorId: "$products._id",
                  price: "$products.totalPrice",
                  date: { $dateToString: { format: "%d-%m-%Y", date: "$date" } },
                  paymentMethod: "$paymentMethod",
                },
              },
            ])
            .toArray();
          console.log("sales", sales);
          resolve(sales);
        });
      },
    
      getThisDaySalesReport: (vendorId) => {
        return new Promise(async (resolve, reject) => {
          let thisday = new Date().getUTCDate();
          let thismonth = new Date().getMonth() + 1;
          let thisyear = new Date().getFullYear();
          console.log(thisday, thismonth, thisyear);
          let thisDaySales = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .aggregate([
              {
                $unwind: "$products",
              },
              {
                $match: {
                  $and: [
                    { "products._id": objectId(vendorId) },
                    { "products.status": "Delivered" },
                  ],
                },
              },
              {
                $project: {
                  _id: null,
                  orderId: "$_id",
                  day: { $dayOfMonth: "$date" },
                  month: { $month: "$date" },
                  year: { $year: "$date" },
                  vendorId: "$products._id",
                  price: "$products.totalPrice",
                  date: { $dateToString: { format: "%d-%m-%Y", date: "$date" } },
                  paymentMethod: "$paymentMethod",
                },
              },
              {
                $match: {
                  $and: [
                    { year: thisyear },
                    { month: thismonth },
                    { day: thisday },
                  ],
                },
              },
            ])
            .toArray();
          console.log("sales", thisDaySales);
          resolve(thisDaySales);
        });
      },
    
    
      //this is for last three days sales report for  chart
      getDaySales: (vendorId) => {
        return new Promise(async (resolve, reject) => {
          let sales = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .aggregate([
              {
                $sort: { date: -1 },
              },
              {
                $unwind: "$products",
              },
              {
                $match: {
                  $and: [
                    { "products._id": objectId(vendorId) },
                    { "products.status": "Delivered" },
                  ],
                },
              },
              {
                $project: {
                  toatlAmount: "$toatlAmount",
                  date: { $dateToString: { format: "%d-%m-%Y", date: "$date" } },
                },
              },
              {
                $group: {
                  _id: "$date",
                  total: { $sum: "$toatlAmount" },
                },
              },
              {
                $limit: 3,
              },
            ])
            .toArray();
          console.log("", sales);
          resolve(sales);
        });
      },
      getThisMonthSalesReport: (vendorId) => {
        return new Promise(async (resolve, reject) => {
          let thismonth = new Date().getMonth() + 1;
          let thisyear = new Date().getFullYear();
          thisMonthSales = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .aggregate([
              {
                $unwind: "$products",
              },
              {
                $match: {
                  $and: [
                    { "products._id": objectId(vendorId) },
                    { "products.status": "Delivered" },
                  ],
                },
              },
              {
                $project: {
                  _id: null,
                  orderId: "$_id",
                  month: { $month: "$date" },
                  year: { $year: "$date" },
                  vendorId: "$products._id",
                  price: "$products.totalPrice",
                  date: { $dateToString: { format: "%d-%m-%Y", date: "$date" } },
                  paymentMethod: "$paymentMethod",
                },
              },
              {
                $match: { $and: [{ year: thisyear }, { month: thismonth }] },
              },
              {
                $sort: { date: -1 },
              },
            ])
            .toArray();
          console.log("sales", thisMonthSales, "thisyear", thisyear);
          resolve(thisMonthSales);
        });
      },
    
      //this is for last two month sales report  
      monthlyWiseSales: (vendorId) => {
        return new Promise(async (resolve, reject) => {
          let monthlyWiseSales = await db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .aggregate([
              {
                $unwind: "$products",
              },
              {
                $match: {
                  $and: [
                    { "products._id": objectId(vendorId) },
                    { "products.status": "Delivered" },
                  ],
                },
              },
              {
                $group: {
                  _id: { $month: "$date" },
                  total: { $sum: "$toatlAmount" },
                },
              },
              {
                $sort: { _id: -1 },
              },
              {
                $limit: 2,
              },
            ])
            .toArray();
          console.log("monthlyWiseSales", monthlyWiseSales);
          resolve(monthlyWiseSales);
        });
      },
    
    

    vendor_login: (vendor_data) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}

            let vendor = await db.get().collection(collection.VENDOR_COLLECTION).findOne({ Login_name: vendor_data.Name })

            if (vendor) {

                bcrypt.compare(vendor_data.Password, vendor.Login_password).then((status) => {

                    if (status) {
                        console.log("login success")
                        response.vendor = vendor
                        response.status = true
                        console.log("vendor name",response.vendor);
                        resolve(response)
                    }
                    else {
                        console.log("vendor_data", vendor_data.Password);
                        cconole.log("vendor.Login_password", vendor.Login_password);
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
    getVendorDetails: (vendorId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.VENDOR_COLLECTION).findOne({ _id: objectId(vendorId) }).then((vendor) => {
                resolve(vendor)
            })
        })
    },
    updateProfile:(vendorId, vendorDetails) => {
      return new Promise((resolve, reject) => {
          db.get().collection(collection.VENDOR_COLLECTION).updateOne({ _id: objectId(vendorId) }, {
              $set: {
                  Name: vendorDetails.Name,
                  Place: vendorDetails.Place,
                   
              }
          }).then((response) => {
              resolve(response)
          })
      })
  },
  
    getVendorsDetail: (vendorId) => {
      return new Promise(async (resolve, reject) => {
          let VendorsDetail = await db.get().collection(collection.VENDOR_COLLECTION).find({ _id: objectId(vendorId) }).toArray()
          resolve(VendorsDetail[0])
      })
    },
    updateVendor: (vendorId, vendorDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.VENDOR_COLLECTION)
                .updateOne({ _id: objectId(vendorId) }, {
                    $set: {
                        Name: vendorDetails.Name,
                        Place: vendorDetails.Place,
                        Category: vendorDetails.Category,
                        Login_name: vendorDetails.Login_name

                    }
                }
                ).then((response) => {
                    resolve()
                })
        })
    },
    addProfile: (vendorprofile) => {
        return new Promise(async (resolve, reject) => {

            db.get().collection(collection.VENDOR_PROFILE).insertOne(vendorprofile).then((data) => {

                resolve(data.ops[0])

            })
        })
    },
    getprofileDetails:(profileId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.VENDOR_PROFILE).findOne({ _id: objectId(profileId) }).then((profile) => {
                resolve(profile)
            })
        })
    },

    checkPassword:(vendorId,oldPassword)=>{
      return new Promise (async(resolve,reject)=>{
        let response={};
        let admin = await db.get().collection(collection.VENDOR_COLLECTION)
          .findOne({ _id: objectId(vendorId) });
        if (admin) {
          bcrypt.compare(oldPassword,admin.Password).then((status) => {
            if (status) {
             
              response.status = true;
              resolve(response);
            } else {
            
              resolve({ status: false });
            }
          });
        }else {
          
          resolve({ status: false });
        }
      })
    },
    resetPassword:(vendorId,newPassword)=>{
      return new Promise (async(resolve ,reject)=>{
       newPassword = await bcrypt.hash(newPassword, 10);
        await db.get().collection(collection.VENDOR_COLLECTION).updateOne({_id:objectId(vendorId)}, {
         $set: {
             Password: newPassword
         }
       }).then()
       resolve()
      })
    },
    // getProfile: () => {

    //     return new Promise(async (resolve, reject) => {

    //         let profile = await db.get().collection(collection.VENDOR_PROFILE).find().toArray()

    //         resolve(profile)
    //     })
    // }
}