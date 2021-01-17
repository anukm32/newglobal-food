var express = require('express');
const session = require('express-session');
const { response } = require('../app');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const vendorsHelpers = require('../helpers/vendors-helpers');
const config = require('../config/config');
const client = require("twilio")(config.accountSID, config.authToken);

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    userHelpers.getUserStatus(req.session.user._id).then((response) => {
      if (response.UserStatus == "Active") {

        next();

      } else {
        req.session.destroy();
        req.redirect("/");
        next();
      }

    })

  } else {
    res.redirect('/login')
    next();
  }
}


/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  console.log(user);
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products) => {
    res.render('user/homepage', { products, userh: true, user, cartCount });

  })


  // res.render('index', { products,userh:true,user });
});

router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {


    res.render('user/login', { "loginErr": req.session.loginErr })
    req.session.loginErr = false
  }
})

router.get('/signup', (req, res) => {
  res.render('user/signup')
})

router.post('/signup', (req, res) => {

  userHelpers.doSignup(req.body).then((response) => {
    console.log(response);
    res.redirect('/')
  })

})

router.post('/login', (req, res) => {

  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      if (response.user.Status == "Active") {
        req.session.loggedIn = true
        req.session.user = response.user
        res.redirect('/')

      } else {
        req.session.statusErr = true;
        req.session.destroy();
        res.redirect("/login");
      }


    } else {
      req.session.loginErr = true
      res.redirect('/login')
    }
  })

})
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get("/forgot_password",(req,res)=>{
  res.render("user/forgot_password")
})

router.get("/otplogin",(req,res)=>{
  res.render("user/otplogin")
})

router.post("/otpLogin", (req, res) => {
  MobileNumber =  req.body.MobileNumber;
  console.log("mobile", MobileNumber);
  userHelpers.doMobileValidation(MobileNumber).then((response) => {
    console.log("response",response);
    if (response.available) {
      console.log("mobile", MobileNumber)
      userHelpers.doSendOtp(MobileNumber).then((response)=>{
        console.log(response);
        res.status(200);
        res.json(response.Status)
      })
    } else {
      res.json(response)
    }
  });
});

router.post("/verifyotp", (req, res) => {
  MobileNumber = req.body.mobileno, 
  Otp = req.body.Otp;
  console.log(MobileNumber, Otp);
  userHelpers.doVerifyOtp(MobileNumber,Otp).then((response)=>{
    console.log("response",response);
    if(response.status){
      if(response.user.Status=="Active"){
        req.session.userLoggedIn = true;
       req.session.user = response.user;
       console.log("ready",req.session.user);
       res.redirect("/");
      }else{
        req.session.statusErr = true;
        req.session.destroy();
        res.redirect("/login");
      }
    } 
    
  })
  
});


router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  console.log(products);

  res.render('user/cart', { products, user: req.session.user, totalValue })


})
router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  console.log("api call");
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.redirect('/')
  })
})
router.post('/change-product-quantity', (req, res, next) => {
  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user)

    res.json(response)

  })

})
router.post("/removeCartItem", verifyLogin, async (req, res) => {
  console.log("remodecartItem",req.body);
  await userHelpers.removeCartItem(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.session.user._id);
    res.json(response);
  });
});
router.get('/place-order', verifyLogin, async (req, res) => {

  let total = await userHelpers.getTotalAmount(req.session.user._id)
  console.log('get place-order total ')
  console.log(total)
  res.render('user/place-order', { total, user: req.session.user })
})
router.post('/place-order', async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
    // console.log('orderId', orderId)

    if (req.body['payment-method'] === 'COD') {
      res.json({codSuccess: true })
    }
    else {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response)

      })

    }

  })
  console.log('post placeorder', req.body);
})
router.get('/order-success', (req, res) => {
  res.render('user/order-success', { user: req.session.user })
})
router.get('/orders', async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders', { user: req.session.user, orders })
})
router.get('/view-order-products/:id', async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products', { user: req.session.user, products })
})
router.post('/verify-payment',(req,res)=>{
    console.log("verifypayment-test", req.body);
    userHelpers.verifyPayment(req.body).then(()=>{
      userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
        res.json({status:true})
      })
      
    }).catch((err)=>{
      console.log("error",err)
      req.json({status:false,errMsg:''})
    })
  
  })
// router.get('/bakers',(req,res)=>{
 
//   vendorsHelpers.getAllvendors().then((vendors)=>{
//     //console.log(vendors)
//     res.render('user/bakers', { userh: true,vendors,user, cartCount })
 
//    })
// })

router.get("/bakers", async function (req, res) {
  let user = req.session.user;
  let cartCount
  if (user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
    console.log("cartCount",cartCount);
  }
  vendorsHelpers.getAllvendors().then((vendors) => {
    res.render("user/bakers", { userh: true, vendors, user, cartCount });
  });
});


router.get("/view-products/:id", verifyLogin, async function (req, res) {
    let user = req.session.user;
   console.log("user",user);
    if (user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
    }
    let vendorId = req.params.id;
     await productHelpers.getVendorProducts(vendorId).then((products) => {
       console.log("PRODUCT",products);
       console.log("vendor_id",vendorId);
      res.render("user/view-products", {
        userh: true,
        products,
        user,
        cartCount,
      });
     
    });
  });
  router.get("/profile",verifyLogin,(req,res)=>{
      let user= req.session.user
    res.render("user/profile",{user})
    });
    router.post("/updateprofile/:id",verifyLogin,async(req,res)=>{
        userId=req.params.id;
        userData= req.body;
        await userHelpers.updateProfile(userId,userData).then((response)=>{
          res.redirect("/")
        })
      });
      router.get("/resetpassword",verifyLogin,(req,res)=>{
          userId=req.session.user._id
          user= req.session.user
          res.render("user/resetpassword",{userId,user})
         
        })
        router.post("/resetpassword/:id",verifyLogin,async(req,res)=>{
          userId=req.params.id
          oldPassword=req.body.oldPassword,
          newPassword=req.body.Password
         await userHelpers.checkPassword(userId,oldPassword).then((response)=>{
           if(response.status){
            console.log(response.status);
             userHelpers.resetPassword(userId,newPassword).then((response)=>{
              res.redirect("/profile")
            })
           }else{
            console.log(response.status);
            passwordErr=true;
            res.redirect("/resetpassword")
           }
         })
          res.redirect("/resetpassword")
        })
        
module.exports = router;
