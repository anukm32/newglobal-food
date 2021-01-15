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
      console.log("vendorname",response.vendor)
      req.session.loggedIn = true
      req.session.vendor = response.vendor

      res.redirect('/vendor')
    } else {
      res.redirect('/vendor/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})
 router.get('/add-product',function(req,res){
  vendordetails=req.session.vendor;
    adminHelpers.getAllCategories().then((categories) => {
        res.render('vendor/add-product', {vendordetails,vendor: true,categories});
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
router.get("/view-products", verifyLogin, function (req, res) {
  VendorId=req.session.vendor._id;
  productHelpers.getVendorProducts(VendorId).then((products) => {
    
   
    res.render("vendor/view-products", { products,vendor: true });
  });
});
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

router.get("/orders",verifyLogin,async(req,res)=>{
 
  console.log(req.session.vendor._id);
  orders=await vendorsHelpers.getVendorsOrder(req.session.vendor._id)
  res.render("vendor/orders", {  orders,vendor: true })
});
router.get("/view-orders/:id",verifyLogin,async(req,res)=>{
 
  console.log(req.session.vendor._id);
  let orderId=req.params.id
  order=await vendorsHelpers.getOrderDetails(orderId,req.session.vendor._id)
  Orderproducts= await vendorsHelpers.getOrderproducts(orderId,req.session.vendor._id)
  res.render("vendor/view-orders", { order,vendor: true,Orderproducts })
});

router.post("/changestatus",(req,res)=>{
  console.log(req.body);
  let  status = req.body.status
  let orderId =req.body.orderId
  vendorsHelpers.updateOrderStatus(orderId,status, req.session.vendor._id).then(() => {
    
    res.redirect("/vendor/orders");
   
  });
})

router.get("/sales",verifyLogin, (req,res)=>{
  res.render("vendor/sales");
});

router.get("/salesdata",verifyLogin,async(req,res)=>{
  let vendorId=req.session.vendor._id
  response.salesReport = await vendorsHelpers.getSalesReport(vendorId)
  res.json(response)
})

router.get("/salesfilter/:filter",verifyLogin,async(req,res)=>{
  console.log("call test");
  let filter =req.params.filter
  let vendorId=req.session.vendor._id
   if(filter ==="Today"){
    response.salesReport= await vendorsHelpers.getThisDaySalesReport(vendorId);
   }else if(filter ==="ThisMonth"){
    response.salesReport= await vendorsHelpers.getThisMonthSalesReport(vendorId);
   }else if(filter ==="All"){
    response.salesReport= await vendorsHelpers.getSalesReport(vendorId);
   }
  
  res.json(response)
});

router.get("/test",verifyLogin,async(req,res)=>{
  vendorId=req.session.vendor._id
  await vendorsHelpers.getOrderproducts(vendorId)
  
})


// router.get('/profile',(req,res)=>{
//   res.render('vendor/profile')
// })
router.get("/profile",verifyLogin,async(req,res)=>{
  let vendorId= req.session.vendor._id;
   let VendorsDetail = await vendorsHelpers.getVendorsDetail(vendorId);
  console.log(VendorsDetail);
res.render("vendor/profile",{VendorsDetail})
});

router.post("/updateprofile/:id",verifyLogin,async(req,res)=>{
  vendorId=req.params.id;
  vendorData= req.body;
  await vendorsHelpers.updateProfile(vendorId,vendorData).then((response)=>{
    res.redirect("/vendor/")
  })
});

router.get("/resetpassword",verifyLogin,async (req,res)=>{
  let vendorId= req.session.vendor._id;
  let VendorsDetail = await vendorsHelpers.getVendorsDetail(vendorId);
  res.render("vendor/resetpassword",{vendorId,VendorsDetail})
 
});

router.post("/resetpassword/:id",verifyLogin,async(req,res)=>{
  let vendorId= req.session.vendor._id;
  oldPassword=req.body.oldPassword,
  newPassword=req.body.Password
 await vendorsHelpers.checkPassword(vendorId,oldPassword).then(async(response)=>{
   if(response.status){
    console.log(response.status);
    await vendorsHelpers.resetPassword(vendorId,newPassword).then((response)=>{
      res.redirect("/vendor/profile")
    })
   }else{
    console.log(response.status);
    passwordErr=true;
    res.redirect("/admin/resetpassword")
   }
 })
  res.redirect("/admin/resetpassword")
});


// router.get('/view-profile',async(req,res)=>{
//   vendorsHelpers. getprofileDetails().then((profile) => {
//     console.log("profile",profile)
//     res.render('vendor/view-profile', { vendor: true, profile });
   

//   })
// })
// router.post('/profile',async(req,res)=>{
//   vendorsHelpers.addProfile(req.body).then((response)=>{
  
//     console.log("addprofile",req.body)
//     res.redirect('/vendor/view-profile')
//   })
// })
// router.get('/edit-profile/:id',async(req,res)=>{
//   let profile=await vendorsHelpers.getprofileDetails(req.params.id)
//   console.log("edit",profile);
//   res.render('vendor/edit-profile',{vendor:true,profile})
// })
// router.post('/edit-profile/:id',verifyLogin,async(req,res)=>{
//   vendorsHelpers.updateProfile(req.params.id,req.body).then(()=>{
//     res.redirect('/vendor/view-profile')
//   })
// })
module.exports = router;
