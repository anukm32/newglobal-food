var express = require('express');
const { render } = require("../app");
const vendorsHelpers = require('../helpers/vendors-helpers');
const adminHelpers = require('../helpers/admin-helpers');
var router = express.Router();
var vendorHelper = require('../helpers/vendors-helpers');
const { response } = require('express');
const { admin_Login } = require('../helpers/admin-helpers');
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('admin/login')
  }
}


/* GET users listing. */
router.get('/', verifyLogin,function (req, res, next) {
  // vendorsHelpers.getAllvendors().then((vendors)=>{
  //    console.log(vendors)
   res.render('admin/dashboard',{admin:true})
  
});



router.get('/login',(req,res)=>{
  res.render('admin/login')
})
router.get('/dashboard',(req,res)=>{
  res.render('admin/dashboard', {admin:true})
})
router.post('/login',(req,res)=>{
  adminHelpers.admin_Login(req.body).then((response)=>{
    console.log("response login admin")
    console.log(response)
    if(response.status){
      req.session.loggedIn=true
      req.session.admin1=response.admin1
      res.redirect('/admin/dashboard')
    }else{
      res.redirect('/admin/login')
    }
  })
})


router.get('/add-vendor',(req,res)=>{
  res.render('admin/add-vendors', {admin:true})
})




router.post('/add-vendor',function(req,res){
  vendorsHelpers.addvendors(req.body).then((response)=>{
    console.log(req.body)
    res.redirect('/admin/view-vendor')
   
  })

})

router.get('/view-vendor',(req,res)=>{
  vendorsHelpers.getAllvendors().then((vendors)=>{
  res.render('admin/view-vendor', {admin:true,vendors})
})
})
router.get('/vendor-management',(req,res)=>{
  vendorsHelpers.getAllvendors().then((vendors)=>{
    //console.log(vendors)
    res.render('admin/vendor-management', {admin:true,vendors})
 
   })
 
})

router.get('/delete-vendor/:id',(req,res)=>{
  let vendorId=req.params.id
  console.log(vendorId)
  vendorsHelpers.deletevendor(vendorId).then((response)=>{
    res.redirect('/admin/vendor-management')
  })

})
router.get('/edit-vendor/:id',async(req,res)=>{
  let vendor=await vendorsHelpers.getVendorDetails(req.params.id)
  console.log(vendor);
  res.render('admin/edit-vendor',{admin:true,vendor})
})
router.post('/edit-vendor/:id',(req,res)=>{
  vendorsHelpers.updateVendor(req.params.id,req.body).then(()=>{
    res.redirect('/admin/vendor-management')
  })
})
router.get('/add-category',(req,res)=>{
  res.render('admin/add-category',{admin:true})

})
router.post('/add-category',(req,res)=>{
  console.log(req.body);
  adminHelpers.addCategory(req.body,(result)=>{
    res.render("admin/category-management",{admin:true,categories})
  })
  
})
router.get('/view-category',(req,res)=>{
  res.render('admin/view-category',{admin:true})
})
router.get('/category-management',(req,res)=>{
  adminHelpers.getAllCategories().then((categories) => {
    res.render('admin/category-management', {categories,admin:true})
    console.log("category",categories)
})
})
router.post('/category-management',(req,res)=>{
  adminHelpers.getAllCategories().then((categories) => {
    res.render('admin/category-management', {categories,admin:true})
})
})

router.get('/edit-category/:id',async(req,res)=>{
  let category =await adminHelpers.getCategoryDetails(req.params.id)
  console.log("edit category",category);
  res.render('admin/edit-category',{admin:true,category})

})

router.post('/edit-category/:id',(req,res)=>{
  adminHelpers.updateCategory(req.params.id,req.body).then(()=>{
    res.redirect('/admin/category-management')
  })
})
router.get('/delete-category/:id',(req,res)=>{
  let categoryId=req.params.id
  console.log(categoryId)
  adminHelpers.deletecategory(categoryId).then((response)=>{
    res.redirect('/admin/category-management')
  })

})


router.get('/add-users',(req,res)=>{
    res.render('admin/add-users', {categories})

})

router.post('/add-users',(req,res)=>{
adminHelpers.addUsers(req.body).then((response)=>{
    console.log(req.body)
    res.redirect('/admin/view-all-users')
  })  

})

router.get('/view-all-users',(req,res)=>{
  adminHelpers.getAllusers().then((users)=>{
  res.render('admin/view-all-users', {admin:true,users})
  console.log("userddd",users)
})
})


router.get('/edit-user/:id',async(req,res)=>{
  let user =await adminHelpers.getuserDetails(req.params.id)
  console.log("edit user",user);
  res.render('admin/edit-user',{admin:true,user})

})

router.post('/edit-user/:id',(req,res)=>{
  adminHelpers.updateUser(req.params.id,req.body).then(()=>{
    res.redirect('/admin/view-all-users')
  })
})
router.get('/add-profile',(req,res)=>{
  res.render('admin/add-profile',{admin:true})
})
router.post('/add-profile',(req,res)=>{
  adminHelpers.addProfile(req.body).then((response)=>{
    console.log(req.body)
    res.redirect('/admin')
  })  

})
router.get('/view-profile',(req,res)=>{
  adminHelpers.getProfile().then((adminprofile)=>{
  res.render('admin/view-profile', {admin:true,adminprofile})
  console.log("userddd",adminprofile)
})
})
router.get('/edit-profile/:id',async(req,res)=>{
  let admin_profile=await adminHelpers.getAdminProfile(req.params.id)
  console.log(admin_profile);
  res.render('admin/edit-profile',{admin:true,admin_profile})
})
router.post('/edit-profile/:id',async(req,res)=>{
  let admin_profile=await adminHelpers.getAdminProfile(req.params.id)
  adminHelpers.updateProfile(req.params.id,req.body).then(()=>{
    res.render('admin/dashboard',{admin:true,admin_profile})
    console.log("name",admin_profile)
  })
})
router.get('/sales',async (req,res)=>{
   let sales = await adminHelpers.getSalesReport();
  res.render('admin/sales', {admin:true});
});
module.exports = router;
