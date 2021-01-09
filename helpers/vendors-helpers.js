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

            let vendors = await db.get().collection(collection.VENDOR_COLLECTION).find().toArray()

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
    getProfile: () => {

        return new Promise(async (resolve, reject) => {

            let profile = await db.get().collection(collection.VENDOR_PROFILE).find().toArray()

            resolve(profile)
        })
    }
}