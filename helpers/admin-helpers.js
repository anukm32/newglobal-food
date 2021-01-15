var db=require('../config/connection')
var collection=require('../config/collections')
var objectId=require('mongodb').ObjectID
var bcrypt=require('bcrypt')

module.exports={
    
  admin_Login:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}

            let admin1=await db.get().collection(collection.ADMIN_COLLECTION).findOne({Name:adminData.Name})
            if(admin1){

                bcrypt.compare(adminData.Password,admin1.Password).then((status)=>{

                    if(status){
                        console.log("login success")
                        response.admin1=admin1
                        response.status=true
                        resolve(response)
                    }
                    else{
                        console.log("login failed")
                        resolve({status:false})
                    }

                })

            }else{
                console.log("login failed")
                resolve({status:false})
            }
        })
    },

    addCategory: (category,callback)=>{
        db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((data)=>{
            callback(true)

        })

    },
    getAllCategories:()=>{
        return new Promise(async(resolve,reject)=>{
            let categories=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            // resolve(categories.ops[0])
            // console.log()
            resolve(categories)
        })
    },
    getCategoryDetails:(categoryId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(categoryId)}).then((category)=>{
                resolve(category)
            })
        })
    },
    
    updateCategory:(categoryId,categoryDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION)
            .updateOne({_id:objectId(categoryId)},{
                $set:{
                    Categories:categoryDetails.Categories,
                    Commission:categoryDetails.Commission,
                  
                }
            }
            ).then((response)=>{
                resolve()
            })
        })
    },
    deletecategory:(categoryId)=>{

        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).removeOne({_id:objectId(categoryId)}).then((response)=>{

                console.log(response)

  
                resolve(response)
                

            })
        })


    },
    addUsers: (userData) => {
        return new Promise(async (resolve, reject) => {

            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {

                resolve(data.ops[0])

            })

        })


    },
    getAllusers:()=>{

        return new Promise(async(resolve,reject)=>{

            let users=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            
            resolve(users)
            console.log("users",users)
        })
    },
    getuserDetails:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((user)=>{
                resolve(user)
            })
        })
    },
    updateUser:(userId,userDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION)
            .updateOne({_id:objectId(userId)},{
                $set:{
                    Name:userDetails.Name,
                    Email:userDetails.Email,
                    Mobile:userDetails.Mobile,
                    Status:userDetails.Status
                  
                }
            }
            
            ).then((response)=>{
                resolve()
            })
        })
    },
    addProfile:(admindata)=>{
        return new Promise(async (resolve, reject) => {

           
            db.get().collection(collection.ADMIN_PROFILE).insertOne(admindata).then((data) => {

                resolve(data.ops[0])

            })

        })

    },
    getProfile:()=>{
        return new Promise(async(resolve,reject)=>{

            let adminprofile=await db.get().collection(collection.ADMIN_PROFILE).find().toArray()
            
            resolve(adminprofile)
            
        })

    },
    getAdminProfile:(profileId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADMIN_PROFILE).findOne({_id:objectId(profileId)}).then((user)=>{
                resolve(user)
            })
        })
    },
    updateProfile:(profileId,profileDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADMIN_PROFILE)
            .updateOne({_id:objectId(profileId)},{
                $set:{
                    Name:profileDetails.Name,
                    Mobile:profileDetails.Mobile
                   
                  
                }
               
            }
            ).then((response)=>{
                resolve()
                
            })
        })
    },
    getSalesReport: () => {
        return new Promise(async (resolve, reject) => {
            sales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $unwind: "$products",
                },
                {
                    $match: { "products.status": "Delivered" },
                },
                {
                    $sort: { date: -1 }
                },
                {
                    $project: {
                        orderId: "$_id",
                        vendorId: "$products._id",
                        price: "$products.totalPrice",
                        date: { "$dateToString": { "format": "%d-%m-%Y", "date": "$date" } },
                        paymentMethod: "$paymentMethod"
                    },
                },

                {
                    $lookup: {
                        from: collections.VENDOR_COLLECTION,
                        localField: "vendorId",
                        foreignField: "_id",
                        as: "vendor",
                    },
                },
                {
                    $project: {
                        orderId: 1,
                        vendorId: 1,
                        price: 1,
                        date: 1,
                        paymentMethod: 1,
                        vendorName: { $arrayElemAt: ["$vendor.Name", 0] },
                    },
                },


            ]).toArray()
            console.log("sales", sales);
            resolve(sales)
        })
    },
}