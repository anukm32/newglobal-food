var express = require('express')
var router = express.Router()
const vendorsHelpers = require('../helpers/vendors-helpers');
const { response } = require('express');
const { vendor_login } = require('../helpers/vendors-helpers');
var productHelper = require('../helpers/product-helpers');
const productHelpers = require('../helpers/product-helpers');
const adminHelpers = require('../helpers/admin-helpers');

const verifyLogin=(req,res,next)=>{
  if(req.session.vendor){
    next()
  }else{
    res.redirect('/vendor/login')
  }
}

/* GET vendor page. */

router.get('/', verifyLogin,function (req, res, next) {

  productHelpers.getAllProducts().then((products) => {
    res.render('vendor/dashboard', { vendor: true, products });

  })


});
router.get('/dashboard',verifyLogin,(req,res)=>{
  res.render('vendor/dashboard',{vendor:true})
})
router.get('/login', function (req, res, next) {
  res.render('vendor/login');
});
router.post('/login',(req, res) => {
  vendorsHelpers.vendor_login(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.vendor = response.vendor
      res.redirect('/vendor')
    } else {
      res.redirect('/vendor/login')
    }
  })
})
 router.get('/add-product',function(req,res){
    adminHelpers.getAllCategories().then((categories) => {
        res.render('vendor/add-product', {vendor: true,categories});
    })

})

router.post('/add-product', (req, res) => {
 
  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.Image
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.redirect('/vendor/view-products')
      } else {
        console.log(err);
      }
    })


})

})
router.get('/view-products',(req,res)=>{
  productHelpers.getAllProducts().then((products) => {
    res.render('vendor/view-products', { vendor: true, products });

  })
})
router.get('/delete-product/:id',(req,res)=>{
  let productId=req.params.id
  console.log(productId)
  productHelpers.deleteproduct(productId).then((response)=>{
    res.redirect('/vendor/view-products');
  })
})
router.get('/edit-product/:id',async(req,res)=>{
  let products=await productHelpers.getProductDetails(req.params.id)
  adminHelpers.getAllCategories().then((categories) =>{
  res.render('vendor/edit-product',{vendor:true,products,categories})
})
})
router.post('/edit-product/:id',(req,res)=>{
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
  res.redirect('/vendor/view-products');
  })
})
router.get('/profile',(req,res)=>{
  res.render('vendor/profile',{vendor:true})
})
router.get('/view-profile',async(req,res)=>{
  vendorsHelpers.getProfile().then((profile) => {
    res.render('vendor/view-profile', { vendor: true, profile });
   

  })
})
router.post('/profile',async(req,res)=>{
  vendorsHelpers.addProfile(req.body).then((response)=>{
  
    console.log("addprofile",req.body)
    res.redirect('/vendor/view-profile')
  })
})
router.get('/edit-profile/:id',async(req,res)=>{
  let profile=await vendorsHelpers.getprofileDetails(req.params.id)
  console.log("edit",profile);
  res.render('vendor/edit-profile',{vendor:true,profile})
})
router.post('/edit-profile/:id',verifyLogin,async(req,res)=>{
  vendorsHelpers.updateProfile(req.params.id,req.body).then(()=>{
    res.redirect('/vendor/view-profile')
  })
})
module.exports = router;
