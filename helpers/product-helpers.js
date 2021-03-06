var db = require('../config/connection')
var collection = require('../config/collections')
var objectId=require('mongodb').ObjectID
module.exports = {

    addProduct: (product, callback) => {
         product.Price=parseInt(product.Price)
        console.log(product)
        db.get().collection('product').insertOne(product).then((data) => {
            callback(data.ops[0]._id)
        })




    },
    getAllProducts:() => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })

    },
    getVendorProducts: (VendorId) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({VendorId:VendorId}).toArray()
            resolve(products)

        })
        
    },
    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(productId) }).then((products) => {
                resolve(products)
            })
        })
    },
    updateProduct:(productId,productDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(productId)},{
                $set:{
                    Vendorname:productDetails.Vendorname,
                    Productname:productDetails.Productname,
                    Category:productDetails.Category,
                    Price:productDetails.Price,
                  
                }
            }
            ).then((response)=>{
                resolve()
            })
        })
    },
    deleteproduct:(productId)=>{

        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
                $set: {
                    Status:"Block"
                }
            }).then((response)=>{

                console.log(response)

  
                resolve(response)
                

            })
        })


    },
}

