const express = require('express')
const jwt = require('jsonwebtoken')
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017";
var fs = require('fs');
const app = express();
var dateTime = require('node-datetime')
var bodyParser = require('body-parser');  
const { json } = require('body-parser');
// Create application/x-www-form-urlencoded parser  
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
//verify token
function verifytoken(req, res, next){
    const bearerHeader = req.headers['authorization'];
    if(typeof bearerHeader !== 'undefined'){

        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();

    }else{
        res.sendStatus(403)
    }
}
//customerdetails
//signup
app.post("/api/signup" ,(req,res)=>{
    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("Kishore");
     var query = {
        first_name: null,
        last_name: null,
        email: req.body.email,
        password: req.body.password,
        mobile_no:null,
        address: null,
        district:null,
        city:null,
        pincode:null,
        orders:[],
        wishlist:[]
     }
     dbo.collection("customers").insertOne(query, function(err, res1) {
         if (err) throw err;
         res.json({
             status: 200,
             message:"Registered Successfully"
         })
         db.close();
       });
     });
    });
 //login
app.post("/api/login",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        var query = {
            email: req.body.email.toString(),
        }
        console.log(query)
        dbo.collection("customers").find(query).toArray(function(err, result){
            if (err) {
                console.log(err)
            }else{
                
                if(result.length===0){
                    res.send({
                        status: 404,
                        message:"User Not found!"
                    }) 
                }
                else {
                var email = result[0].email
                var pass = result[0].password
                if(email === req.body.email && pass === req.body.password){
                    const user = result;
                    jwt.sign({user},'secretkey',{expiresIn: '24h'},(err,token)=>{
                        res.send({
                            status: 200,
                            message:"LoggedIn Successfully!",
                            token,
                            identifier: result[0]._id
                        })
                    });
                }else{
                    res.send({
                        status: 400,
                        message:"Password doesn't match!"
                    })
                }}
            }
        });
        
        });
})
//default api
app.post("/api",verifytoken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authdata)=>{
        if(err){
            res.json({
                status: 403,
                message:"Loggedout"
            })
        }else{
            res.json({
                status: 200,
                message:"Already Loggedin",
                identifier: authdata.user[0]._id
            });
        }
    })
    
});
var ObjectId = require('mongodb').ObjectID;

app.post("/api/customerdetails",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        var o_id = new ObjectId(req.body.id);
        dbo.collection("customers").find({"_id": o_id},{projection:{password: 0,_id: 0}}).toArray(function(err, result) {
            if (err) throw err;
            res.json(result)
            console.log(result)
            db.close();
          });
    })
})
//updatecustomerdetails
app.post("/api/updatecustomerdetails",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        var o_id = new ObjectId(req.body.id)
        var data = [
            {
            $set:{
            first_name: req.body.fn,
            last_name: req.body.ln,
            address: req.body.addr,
            pincode: req.body.pin,
            district: req.body.dist,
            city: req.body.city,
            mobile_no: req.body.mobile
            }
        }
        ]
        dbo.collection("customers").updateMany({"_id":o_id},data,function(err,result){
            if (err) throw err;
            res.json({
                "status":200,
                "message":"Updated successfully"
            })
        })
    })
})
//retriveproduct
let arr=[]
app.post("/retriveorders",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        var o_id = new ObjectId(req.body.id);
        dbo.collection("customers").find({"_id": o_id}).toArray(function(err, result) {
            if (err) throw err;
            var orders = result[0].orders
            res.send(orders)
            db.close();
          });
    })
})
app.post("/retrivewishlist",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        var o_id = new ObjectId(req.body.id);
        dbo.collection("customers").find({"_id": o_id}).toArray(function(err, result) {
            if (err) throw err;
            if(result[0].wishlist.length!=0){
                res.json(result[0].wishlist)
            }else{
                res.json({
                    status: "null"
                })
            }
            db.close();
          });
    })
})
//retrieveProduct
app.post("/retriveproduct",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        var o_id = new ObjectId(req.body.product_id);
        var vc=0
        dbo.collection("products").find({"_id": o_id}).toArray(function(err, result) {
            if (err) throw err;
            vc = result[0].viewCount
            dbo.collection('products').updateOne({"_id":o_id},{$set:{viewCount: vc+1 }})

            res.send(result[0])
            db.close();
          });
    })
})
//cancelorder
app.post("/cancelorder",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        var o_id = new ObjectId(req.body.id);
        var data ={
            $set: {
                orders: {
                  product_id: req.body.product_id,
                  date: req.body.date,
                  deliverstatus: "cancelled"
                }
              }
        }
        dbo.collection("customers").updateMany({"_id": o_id},{
            
                orders: [{$set:{
                  product_id: req.body.product_id,
                  date: req.body.date,
                  deliverstatus: "cancelled"
                }}]
              
        },function(err,result1){
            if(err) throw err;
            if(result1.result.nModified!=0){
                res.json({
                    status: 200,
                    message: "order cancelled"
                })
            }else{
                res.json({
                    status: 404,
                    message: "Product not found"
                })
            }
        })
    })
})
//placeorder
app.post("/placeorder",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        var o_id = new ObjectId(req.body.id);
        var data ={
            $addToSet:{
                orders:{
                    $each: [
                        {
                            product_id: req.body.productId,
                            category: req.body.category,
                            date: dateTime.create().format('Y-m-d H:M:S'),
                            paymentMode: "Cash On Delivery(COD)",
                            deliverstatus: "Not Delivered"
                        }
                    ]
                        }
                    
                }
            }
        dbo.collection("customers").update({"_id": o_id},data,function(err, result){
            if(err){
                res.json({
                    status: 403,
                    message: "Unable to place order"
                })
            }else{
                console.log(req.body.productId)
                var bc=0
                dbo.collection("products").find({"_id": ObjectId(req.body.productId)}).toArray(function(err, result2) {
                    if (err) throw err;
                    console.log(result2)
                    bc = result2[0].buyCount
                    dbo.collection('products').updateOne({"_id":ObjectId(req.body.productId)},{$set:{buyCount: bc+1 }})

                    db.close();
                });
                res.json({
                    status: 200,
                    message: "Order placed successfully"
                })
            }
        })
    })
})
//wishlist
app.post("/addtowishlist",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        var o_id = new ObjectId(req.body.id);
        var data ={
            $addToSet:{
                wishlist:{
                    $each: [
                        {
                            product_id: req.body.product_id,
                            category: req.body.category,
                        }
                    ]
                        }
                    
                }
            }
        dbo.collection("customers").find({"_id": o_id}).toArray(function(err,result){
            if(err) throw err
            if(result[0].wishlist.length!=0){
                if(result[0].wishlist.find(item=>item.product_id===req.body.product_id)){
                    res.send({
                        status: 400,
                        message: "Item Already exist in Wishlist"
                    })
                }else{
                    dbo.collection("customers").update({"_id": o_id},data,function(err, result){
                        if(err){
                            throw err
                        }else{
                            res.json({
                                status: 200,
                                message: "Added to wishlist",
                            })
                        }
                    })
                }
            }else{
                dbo.collection("customers").update({"_id": o_id},data,function(err, result){
                    if(err){
                        throw err
                    }else{
                        res.json({
                            status: 200,
                            message: "Added to wishlist",
                        })
                    }
                })
            }
            
        })
    })
})
//remove from wishlist
app.post("/removewishlist",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        var o_id = new ObjectId(req.body.id);
        var data ={
            $pull: {
                wishlist: {
                  product_id: req.body.product_id
                }
              }
        }
        dbo.collection("customers").updateMany({"_id": o_id},data,function(err,result1){
            if(err) throw err;
            if(result1.result.nModified!=0){
                res.json({
                    status: 200,
                    message: "Successfully removed from Wishlist"
                })
            }else{
                res.json({
                    status: 404,
                    message: "Product not found"
                })
            }
        })
    })
})
//mostbought
app.get("/mostviewed",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        dbo.collection("products").find({viewCount:{$gt: 5}},{projection:{description:0}}).toArray(function(err, result) {
            if (err) throw err;
            if(result.length!=0){
            res.json(result)}
            else{
                dbo.collection('products').find({},{projection:{description:0}}).toArray(function(err, result){
                    res.json(result.slice(0,3))
                })
            }
          });
    }) 
})
//mostviewed
app.get("/mostbuyed",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        dbo.collection("products").find({buyCount:{$gt: 3}},{projection:{description:0}}).toArray(function(err, result) {
            if (err) throw err;
            if(result.length!=0){
            res.json(result)}
            else{
                dbo.collection('products').find({},{projection:{description:0}}).toArray(function(err, result){
                    res.json(result.slice(0,3))
                })
            }
          });
    }) 
})

var carousel = ['mi10.jpg','mibox4k.jpg','mioutdoor.jpg','redminote8pro.jpg','mi-notebook.jpg']
var laptop = [
    {
        name: '001.png',
        brand: 'mi notebook 14',
        price: 41999,
        category: "laptops",
        highlights:"The Mi Notebook 14 is more affordable than the Mi Notebook 14 Horizon edition, but loses some of the premium styling and specifications. It weighs 1.5kg and is under 18mm thick. You get a 14-inch full-HD anti-reflective screen, which is somewhat dull but has good viewing angles. All three variants use the same quad-core Intel Core i5-10210U processor which is based on the 'Comet Lake' architecture, and have 8GB of DDR4-2666 RAM which is soldered and not upgradeable. You can choose between a 256GB or 512GB SATA SSD, and optional Nvidia GeForce MX250 discrete GPU.",
        description:[
            {
                "title": "processor",
                "desc":"10th Generation Intel® Core™ i5--1.6GHz quad-core with boost clock (up to 4.2GHz)",
            },
            {
                "title": "display",
                "desc":"35.56cm (14) FHD Anti-glare Display",
            },
            {
                "title": "graphics",
                "desc": "NVIDIA® GeForce® MX250 / Intel® UHD Graphics 620",
            },
            {
                "title": "storage",
                "desc": "256GB / 512GB SATA 3 SSD",
            },
            {
                "title":"memory",
                "desc":"8GB 2666MHz DDR4 RAM"
            },
            {
                "desc": "Windows 10 home",
                "title":"os"
            },
            {
                "title":"battery",
                "desc":"46Wh Battery.Backup of up to 10Hrs.65W Power Adapter"
            },{
                "title":"ports",
                "desc":"2 x Type-A USB 3.1 Gen 1--1 x USB 2.0--1 x HDMI--1 x Combo Audio Jack--1 x DC-jack"
            },
            {
                "title":"audio",
                "desc":"2x2W Stereo Speakers-DTS Audio Processing App Support-3.5mm headphone jack"
            },
            {
                "title":"connections",
                "desc":"Wireless LAN:Dual-band 802.11ac Wi-Fi--Bluetooth:Bluetooth V5.0"
            },
            {
                "title":"design",
                "desc":"17.95mm--323mm--228mm--1.5kg--Thin and Light"
            },
            {
                "title":"box contents",
                "desc":"Mi Notebook 14 x 1U--Power Adapter with Power Cord x 1U--User Manual x 1U--Mi Webcam HD 720p x1U(Free with the Mi Notebook 14, will be given as a separate bundle)"
            }
        ]
    },
    {
        name: '002.png',
        brand: 'mi notebook 14 (horizon edition)',
        price: 54999,
        highlights:"Mi Notebook 14 Horizon Edition is stunningly compact, thin, and weighs just 1.35kg. A beautifully designed 35.5cm (14) Horizon display with super-thin 3mm bezels gives you an immersive viewing experience that you will love on the laptop. Equipped with the 10th Generation Intel® Core™ i5 Processor, the Mi Notebook 14 Horizon Edition is a productivity powerhouse that lets you multitask like a Pro Whether it’s binge-watching, coding or designing you will experience the Mi Notebook delivering on the promise of speed and performance at its best. There is nothing better than casually gaming on the Mi Notebook Horizon Edition as it comes with one of India's first NVIDIA® GeForce® MX350 and gives you unmatched results. With 5 times faster transfer speeds, boot-ups and game-loads, it comes with a 512GB SSD. Designed for an effortless typing experience, it comes with scissor switch keys with a travel distance of 1.3mm, making typing more precise than ever. With all of this and also a 46Wh Battery with 10 Hour Backup, we’ve got you covered for the whole day",
        category: "laptops",
        description:[
            {
                "title": "processor",
                "desc":"10th Generation Intel® Core™ i7 / 10th Generation Intel® Core™ i5",
            },
            {
                "title": "display",
                "desc":"35.56cm(14) Full HD (1920 x 1080) Anti-glare 16:9 Horizon Display--91 % screen-to-body ratio--178° Wide-viewing Angle",
            },
            {
                "title": "graphics",
                "desc": "NVIDIA® GeForce® MX350",
            },
            {
                "title": "storage",
                "desc": "512GB SATA 3 SSD--600 MB/s Speed",
            },
            {
                "title":"memory",
                "desc":"8GB 2666MHz DDR4 RAM"
            },
            {
                "desc": "Windows 10 home",
                "title":"os"
            },
            {
                "title":"battery",
                "desc":"46Wh Battery.Backup of up to 10Hrs.65W Power Adapter"
            },{
                "title":"ports",
                "desc":"1 x Type-C™ USB 3.1 Gen 1 (For data transfer)--2 x Type-A USB 3.1 Gen 1--1 x USB 2.0--1 x--1 x Combo Audio--1 x Charging Port--2 x Type-A USB 3.1 --1 x US--1 x--1 x Combo Audio--1 x Charging Port"
            },
            {
                "title":"audio",
                "desc":"2x2W Stereo Speakers-DTS Audio Processing App Support-3.5mm headphone jack"
            },
            {
                "title":"connections",
                "desc":"Wireless LAN:Dual-band 802.11ac Wi-Fi 2x2--Bluetooth:Bluetooth V5.0"
            },
            {
                "title":"design",
                "desc":"17.15mm--321mm--206.8mm--1.35kg--Super Thin Bezels & Ultra Light"
            },
            {
                "title":"box contents",
                "desc":"Mi Notebook 14 Horizon Edition x 1U--Power Adapter with Power Cord x 1U--User Manual x 1U--Mi Webcam HD 720p x1U(Free with the Mi Notebook 14 Horizon Edition, will be given as a separate bundle)"
            }
        ]
    }
]
var tv = [
    {
        name: 'mi4apro43.jpeg',
        brand: 'mi TV 4A pro',
        size: "43",
        price: 21999,
        highlights:"There is no fun in watching your favourite movie or show on a TV where the display quality is poor. Now, boost the fun and watch them all in good and clear-quality on this 108 cm (43) Mi smart TV. Its Full HD display can accentuate your viewing experience and make it better. You can even access video streaming apps on it and never run out of quality-content to watch and enjoy. It comes with speakers which that deliver powerful audio which lets you experience the environment of a cinema hall right in your bedroom or living room.",
        category: "television",
        description:[
            {
                "title":"display and size",
                "desc":"LED 108 cm (43 inches)"
            },
            {
                "title":"resolution",
                "desc":"Full HD 1920 x 1080 Pixels 60Hz refresh rate"
            },
            {
                "title":"sound",
                "desc":"20Watt speakers"
            },
            {
                "title":"supported apps",
                "desc":"Netflix--Prime Video--Disney+ Hotstar-YouTube--5000+ apps from Google Play Store"
            },
            {
                "title":"OS",
                "desc":"Android (Google Assistant & Chromecast in-built)"
            },
            {
                "title":"storage and RAM",
                "desc":"8GB/1GB"
            },
            {
                "title":"connectivity",
                "desc":"Wireless LAN:2.4GHz--Bluetooth:Bluetooth V4.1"
            },
            {
                "title":"ports",
                "desc":"3 x USB ports--An Antenna input--AV port--3 x HDMI ports--An Ethernet port--3.5mm headphone jack"
            },
            {
                "title":"box contents",
                "desc":"1 x LED TV--Table Top Stands--1 x User Manual--1 x Warranty Card--1 x Remote Control--screw bag--Power cord"
            },
        ]
    },
    {
        name: 'mi4cpro32.png',
        brand: 'mi TV 4C pro',
        size: "32",
        price: 14499,
        highlights:"Equipped with a HD-Ready display, enjoy your multimedia content, favourite TV shows and movies in stunning quality. With a perfect balance of contrast and brightness, this television reproduces authentic colours and excellent clarity, giving you an immersive viewing experience.",
        category: "television",
        description:[
            {
                "title":"display and size",
                "desc":"LED 80 cm (32 inches)"
            },
            {
                "title":"resolution",
                "desc":"HD Ready 1366 x 768 pixels 60Hz refresh rate"
            },
            {
                "title":"sound",
                "desc":"20Watt speakers"
            },
            {
                "title":"supported apps",
                "desc":"Netflix--Prime Video--Disney+ Hotstar-YouTube--5000+ apps from Google Play Store"
            },
            {
                "title":"OS",
                "desc":"Android (Google Assistant & Chromecast in-built)"
            },
            {
                "title":"storage and RAM",
                "desc":"8GB/1GB"
            },
            {
                "title":"connectivity",
                "desc":"Wireless LAN:2.4GHz--Bluetooth:Bluetooth V4.1"
            },
            {
                "title":"ports",
                "desc":"2 x USB ports--An Antenna input--AV port--3 x HDMI ports--An Ethernet port--3.5mm headphone jack"
            },
            {
                "title":"box contents",
                "desc":"1 x LED TV--Table Top Stands--1 x User Manual--1 x Warranty Card--1 x Remote Control--screw bag--Power cord"
            },
        ]
    },{
        name: 'mi4pro55.png',
        brand: 'mi TV 4 pro',
        size: "55",
        price: 47999,
        highlights:"The Mi LED TV 4 PRO 138.88 cm (55) dons features such as Full-HD ultra bright display, 64-bit quad-core cortex A53 with Mali-450 MP3 for smooth interactions , PatchWall comes with over 7,00,000 hours of content right on your home page that adapts automatically according to latest trends and topics, multiple ports to connect upto 3 HDMI devices(1ARC) and 3 USBs along with SPDIF, 3.5mm Aux-in. The simple 11 button Mi Remote can control both TV and set-top box (Mi IR Cable required). The Mi LED TV 4 PRO 138.88 cm (55) is the smart Android TV that has almost everything that you are looking for in a TV and is super easy to use.",
        category: "television",
        description:[
            {
                "title":"display and size",
                "desc":"LED 138 cm (55 inches)"
            },
            {
                "title":"resolution",
                "desc":"4K HDR 3840 x 2160 Pixels 60Hz refresh rate"
            },
            {
                "title":"sound",
                "desc":"20Watt speakers"
            },
            {
                "title":"supported apps",
                "desc":"Netflix--Prime Video--Disney+ Hotstar-YouTube--5000+ apps from Google Play Store"
            },
            {
                "title":"OS",
                "desc":"Android (Google Assistant & Chromecast in-built)"
            },
            {
                "title":"storage and RAM",
                "desc":"8GB/2GB"
            },
            {
                "title":"connectivity",
                "desc":"Wireless LAN:2.4GHz--Bluetooth:Bluetooth V4.1"
            },
            {
                "title":"ports",
                "desc":"3 x USB ports--An Antenna input--AV port--3 x HDMI ports--An Ethernet port"
            },
            {
                "title":"box contents",
                "desc":"1 x LED TV--Table Top Stands--1 x User Manual--1 x Warranty Card--1 x Remote Control--screw bag--Power cord"
            },
        ]
    },
    {
        name: 'mi4x65.jpg',
        brand: 'mi TV 4X ',
        size: "65",
        price: 54999,
        highlights:"There is no fun in watching your favourite movie or show on a TV where the display quality is poor. Now, don’t ruin the fun and watch them all in good and clear-quality on this 163.9 cm (65) Mi smart TV. Its 4K display can accentuate your viewing experience and make it better. You can even access video streaming apps on it and never run out of quality-content to watch and enjoy. It comes with multiple speakers that deliver powerful audio which lets you experience the environment of a cinema hall right in your bedroom or living room.",
        category: "television",
        description:[
            {
                "title":"display and size",
                "desc":"LED 163 cm (65 inches)"
            },
            {
                "title":"resolution",
                "desc":"4K HDR+ 3840x2160 Pixels 60Hz refresh rate"
            },
            {
                "title":"sound",
                "desc":"20 Watts Output--Quad Driver Speakers--Dolby+ DTS-HD"
            },
            {
                "title":"supported apps",
                "desc":"Netflix--Prime Video--Disney+ Hotstar-YouTube--5000+ apps from Google Play Store"
            },
            {
                "title":"OS",
                "desc":"Android (Google Assistant & Chromecast in-built)"
            },
            {
                "title":"storage and RAM",
                "desc":"16GB/2GB"
            },
            {
                "title":"connectivity",
                "desc":"Wireless LAN:2.4GHz/3GHz--Bluetooth:Bluetooth V5.0"
            },
            {
                "title":"ports",
                "desc":"3 x USB ports--An Antenna input--AV port--3 x HDMI ports--An Ethernet port"
            },
            {
                "title":"box contents",
                "desc":"1 x LED TV--Table Top Stands--1 x User Manual--1 x Warranty Card--1 x Remote Control--screw bag--Power cord"
            },
        ]
    },
]
var mobiles = [
    {
        name: 'mi8.jpg',
        brand: 'redmi 8',
        spec: "4GB+64GB",
        processor:"Qualcomm Snapdragon 439 Processor",
        price: 9499,
        highlights:"If you are a travel blogger, gamer, entertainment seeker, or a person who loves a high-end personal device, then the Redmi 8 has been created to meet your needs. This smartphone features a 15.8-cm (6.22) Dot Notch Display, a 12 MP + 2 MP AI Dual Camera, and a 5000 mAh High-capacity Battery to offer detailed views of the stunning photos that you can click all day long without running out of battery life.",
        category: "mobiles",
        description:[
            {
                "title":"display",
                "desc":"15.8 cm (6.22 inch) HD+ Display"
            },
            {
                "title":"storage and RAM",
                "desc":"4 GB RAM--64 GB ROM--Expandable Upto 512 GB"
            },
            {
                "title":"cameras",
                "desc":"12MP + 2MP Back Camera--8MP Front Camera"
            },
            {
                "title":"processor",
                "desc":"Qualcomm Snapdragon 439"
            },
            {
                "title":"GPU",
                "desc":"Adreno 505 at 650 MHz"
            },
            {
                "title":"battery",
                "desc":"5000 mAh (Supports 18W fast charging)"
            },
            {
                "title":"connectivity",
                "desc":"Network type: 4G VoLTE, 4G LTE, WCDMA, GSM, Wifi--Bluetooth: V4.2"
            },
            {
                "title":"box contents",
                "desc":"Handset--Mobile Cover--Data Cable--Charger Adapter--Manual--SIM Card Ejector"
            },
        ]
    },
    {
        name: 'miA3.jpg',
        brand: 'mi A3',
        spec: "6GB+128GB",
        processor:"Qualcomm Snapdragon 665 Processor",
        price: 14645,
        highlights:"Boasting a reflective coating and a nano-level holographic pattern, this smartphone from Mi looks jawdropping. It also features a Qualcomm Snapdragon 665 AIE processor that packs a punch when it comes to smartphone performance. And, if you’re an entertainment enthusiast, then you can take advantage of its 15.4-centimetre (6.08) Super AMOLED display to watch your favourite videos in high definition.",
        category: "mobiles",
        description:[
            {
                "title":"display",
                "desc":"15.44 cm (6.08 inch)--HD+ Super AMOLED Display--Corning Gorilla Glass on Front, Back and Camera Modules, 3D Curved Glass Back Design--Splash Proof by P2i"
            },
            {
                "title":"storage and RAM",
                "desc":"6 GB RAM--128 GB ROM Expandable Upto 256 GB"
            },
            {
                "title":"cameras",
                "desc":"48MP + 8MP + 2MP Back Camera--32MP Front Camera"
            },
            {
                "title":"processor",
                "desc":"Qualcomm Snapdragon 665 Processor"
            },
            {
                "title":"GPU",
                "desc":"Adreno 610"
            },
            {
                "title":"battery",
                "desc":"4030 mAh (Supports 18W fast charging)"
            },
            {
                "title":"connectivity",
                "desc":"Network type: 4G VoLTE, 4G LTE, WCDMA, GSM, Wifi--Bluetooth: V5.0"
            },
            {
                "title":"box contents",
                "desc":"Handset--Power Adapter(18W)--USB Cable--Warranty Card--User Guide--SIM Tray Ejection Tool--Back Cover"
            },
        ]
    },
    {
        name: 'mik20pro.jpg',
        brand: 'redmi K20 pro',
        spec: "6GB+128GB",
        processor:"Qualcomm Snapdragon 855 Processor",
        price: 24999,
        highlights:"The K20 Pro opens up new possibilities. The blazing-fast processor Qualcomm Snapdragon 855 gives you peak performance, while a 48 MP Triple camera setup lets you see things from a different perspective altogether. Be it gaming or everyday tasks this device handles it flawlessly. The beautiful 16.23-cm (6.39) Horizon AMOLED display is a delight when it comes to viewing content on the go. The Aura Prime design gives the device a unique look while the Corning Gorilla Glass 5 on the front and back enhances the overall user experience.",
        category: "mobiles",
        description:[
            {
                "title":"display",
                "desc":"16.23 cm (6.39 inch) Full HD+ Display"
            },
            {
                "title":"storage and RAM",
                "desc":"6 GB RAM--128 GB ROM"
            },
            {
                "title":"cameras",
                "desc":"48MP + 13MP + 8MP Back Camera--20MP Popup Front Camera"
            },
            {
                "title":"processor",
                "desc":"Qualcomm Snapdragon 855 Processor"
            },
            {
                "title":"GPU",
                "desc":"Adreno 640"
            },
            {
                "title":"battery",
                "desc":"4000 mAh (Supports 27W fast charging)"
            },
            {
                "title":"connectivity",
                "desc":"Network type: 4G VoLTE, 4G LTE, WCDMA, GSM, Wifi(2.4Ghz, 5Ghz)--Bluetooth: V5.0"
            },
            {
                "title":"box contents",
                "desc":"Redmi K20 Pro--Power adapter(27W)--Simple protective cover--USB Type-C cable--SIM eject tool--User guide--Warranty card"
            },
        ]
    }
]
var streamingdevice = [
    {
        name: '001.jpg',
        brand: 'mi notebook 14',
        price: "54,999"
    },
    {
        name: '002.jpg',
        brand: 'mi notebook air',
        price: "55,600"
    }
]
var fitness = [
    {
        name: '001.jpg',
        brand: 'mi notebook 14',
        price: "54,999"
    },
    {
        name: '002.jpg',
        brand: 'mi notebook air',
        price: "55,600"
    }
]
var audio = [
    {
        name: '001.jpg',
        brand: 'mi notebook 14',
        price: "54,999"
    },
    {
        name: '002.jpg',
        brand: 'mi notebook air',
        price: "55,600"
    }
]
var powerbanks = [
    {
        name: '001.jpg',
        brand: 'mi notebook 14',
        price: "54,999"
    },
    {
        name: '002.jpg',
        brand: 'mi notebook air',
        price: "55,600"
    }
]

for (let i = 0; i < carousel.length; i++){
    (function(i){
        app.get("/"+carousel[i], function(req, res){
        res.sendFile(__dirname + '/assets/img/Caroussel/'+ carousel[i])
    })})(i);
}
for (let i = 0; i < laptop.length; i++){
    (function(i){
        app.get("/"+laptop[i].name, function(req, res){
        res.sendFile(__dirname + '/assets/img/Laptops/'+ laptop[i].name)
    })})(i);
}
for (let i = 0; i < tv.length; i++){
    (function(i){
        app.get("/"+tv[i].name, function(req, res){
        res.sendFile(__dirname + '/assets/img/tv/'+ tv[i].name)
    })})(i);
}
for (let i = 0; i < mobiles.length; i++){
    (function(i){
        app.get("/"+mobiles[i].name, function(req, res){
        res.sendFile(__dirname + '/assets/img/mobiles/'+ mobiles[i].name)
    })})(i);
}

MongoClient.connect(url,function(err,db){
    if(err) throw err;
    var dbo = db.db("Kishore");
    dbo.collection("carousel").remove();
    for(var i=0;i<carousel.length;i++){
        var query={
            name: carousel[i],
            data: 'http://192.168.43.55:8080/'+carousel[i]
        }
        dbo.collection("carousel").insertOne(query,function(err,result){
            if(err) throw err;
            console.log("inserted ")
        })
    }
})
/*
MongoClient.connect(url,function(err,db){
    if(err) throw err;
    var dbo = db.db("Kishore");
    dbo.collection("products").remove();
    for(var i=0;i<laptop.length;i++){
        var query={
            name: laptop[i].brand,
            data: 'http://192.168.43.55:8080/'+laptop[i].name,
            price: laptop[i].price,
            category: laptop[i].category,
            description: laptop[i].description,
            highlights:laptop[i].highlights,
            viewCount: 0,
            buyCount: 0
        }
        dbo.collection("products").insertOne(query,function(err,result){
            if(err) throw err;
            console.log("inserted lap")
        })
    }
    for(var i=0;i<mobiles.length;i++){
        var query={
            name: mobiles[i].brand,
            data: 'http://192.168.43.55:8080/'+mobiles[i].name,
            price: mobiles[i].price,
            category: mobiles[i].category,
            description:mobiles[i].description,
            highlights: mobiles[i].highlights,
            viewCount: 0,
            buyCount:0
        }
        dbo.collection("products").insertOne(query,function(err,result){
            if(err) throw err;
            console.log("inserted mob")
        })
    }
    for(var i=0;i<tv.length;i++){
        var query={
            name: tv[i].brand,
            data: 'http://192.168.43.55:8080/'+tv[i].name,
            price: tv[i].price,
            category: tv[i].category,
            description: tv[i].description,
            highlights: tv[i].highlights,
            viewCount: 0,
            buyCount: 0
        }
        dbo.collection("products").insertOne(query,function(err,result){
            if(err) throw err;
            console.log("inserted tv")
        })
    }
})
*/

//Carousel
app.get("/carousel",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        dbo.collection("carousel").find({}, { projection: { _id: 0, name: 1,data: 1 } }).toArray(function(err, result) {
            if (err) throw err;
            res.json(result)
            db.close();
          });
})
})
//laptops
app.get("/laptops",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        dbo.collection("products").find({"category":"laptops"}).toArray(function(err, result) {
            if (err) throw err;
            res.json(result)
            db.close();
          });
})
})

app.get("/televisions",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        dbo.collection("products").find({"category":"television"}).toArray(function(err, result) {
            if (err) throw err;
            res.json(result)
            db.close();
          });
})
})
// mobiles
app.get("/mobiles",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        dbo.collection("products").find({"category":"mobiles" }).toArray(function(err, result) {
            if (err) throw err;
            res.json(result)
            db.close();
          });
})
})
app.get("/image",(req,res)=>{
    res.sendFile(__dirname+'/assets/img/Laptops/002.png')
})
app.listen(8080,()=> console.log('listening.....8080'))