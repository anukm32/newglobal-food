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
    res.render('user/view-products', { products, userh: true, user, cartCount });

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

router.post("/otpLogin", (req, res) => {
  const CountryCode = "+91";
  let number = req.body.MobileNumber;
  const MobileNumber = CountryCode + number;

  userHelpers.doMobileValidation(MobileNumber).then((response) => {
    console.log("number",number);
    console.log("do mobile", response);
    if (response.available) {
      console.log("do mobile if")
      client.verify
        .services(config.serviceID)
        .verifications.create({
          to: MobileNumber,
          // to:number,
          channel: "sms",
        })
        .then((data) => {
          // save mobile no
          req.session.mobileno = MobileNumber

          console.log("doMobileValidation client verify", data);
          res.status(200);
          res.redirect("/login");

        }).catch((err) => {
          console.log("doMobileValidation client verify cstch", err);

        })
    } else {
      res.send("Number is not available");
    }
  })
})
router.post('/verifyotp', (req, res) => {
  const mobileno = req.session.mobileno
  const otp = req.body.otp
  // console.log("aftermob.", req.body)
  console.log("verify otp", mobileno);
  // client.verify.services(config.serviceID).verifications
  //   .create({
  //     to: mobileno,
  //     code: otp
  //   }).then((data) => {
  //     console.log("data", data);
  //     res.status(200);
  //     res.redirect("/");
  //   }).catch((err) => {
  //     console.log(err);
  //   })
  userHelpers.doVerifyOtp(mobileno,otp).then((response)=>{
    console.log("response",response);
    if(response.status){
      if(response.user.Status=="Active"){
        req.session.loggedIn = true;
        req.session.user=response.user;
        console.log("ready",req.session.user);
        res.redirect("/");
      }else{
        req.session.statusErr=true;
        req.session.destroy();
        res.redirect("/login")
      }
    }
  })
})
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
  console.log("verifypayment", req.body);
  console.log("verifypayment", body);
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })
    
  }).catch((err)=>{
    console.log("error",err)
    req.json({status:false,errMsg:''})
  })

})
router.get('/bakers',(req,res)=>{
  vendorsHelpers.getAllvendors().then((vendors)=>{
    //console.log(vendors)
    res.render('user/bakers', {vendors})
 
   })
})
module.exports = router;
