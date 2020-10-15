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
        address: [],
        orders:[]
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
//retriveproduct
let arr=[]
app.post("/retriveorders",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        var o_id = new ObjectId(req.body.id);
        dbo.collection("customers").find({"_id": o_id},{projection:{_id:0,orders: 1}}).toArray(function(err, result) {
            if (err) throw err;
            var orders = result[0].orders
            res.send(orders)
            db.close();
          });
    })
})
//wishlists
app.post("/retrivewishlist",(req,res)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("Kishore");
        var o_id = new ObjectId(req.body.id);
        dbo.collection("customers").find({"_id": o_id},{projection:{_id:0,wishlist: 1}}).toArray(function(err, result) {
            if (err) throw err;
            var wishlist = result[0].wishlist
            res.json(wishlist)
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
        dbo.collection("products").find({"_id": o_id}).toArray(function(err, result) {
            if (err) throw err;
            res.send(result[0])
            db.close();
          });
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
                res.json({
                    status: 200,
                    message: "Order placed successfully"
                })
            }
        })
    })
})
//wishlist
app.post("/wishlist",(req,res)=>{
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
var carousel = ['mi10.jpg','mibox4k.jpg','mioutdoor.jpg','redminote8pro.jpg','mi-notebook.jpg']
var laptop = [
    {
        name: '001.png',
        brand: 'mi notebook 14',
        price: 41999,
        category: "laptops",
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
                "title":"box",
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
        category: "television"
    },
    {
        name: 'mi4cpro32.png',
        brand: 'mi TV 4C pro',
        size: "32",
        price: 14499,
        category: "television"
    },{
        name: 'mi4pro55.png',
        brand: 'mi TV 4 pro',
        size: "55",
        price: 47999,
        category: "television"
    },
    {
        name: 'mi4x65.jpg',
        brand: 'mi TV 4X ',
        size: "65",
        price: 54999,
        category: "television"
    },
]
var mobiles = [
    {
        name: 'mi8.jpg',
        brand: 'redmi 8',
        spec: "4GB+64GB",
        processor:"Qualcomm Snapdragon 439 Processor",
        price: 9499,
        category: "mobiles"
    },
    {
        name: 'miA3.jpg',
        brand: 'mi A3',
        spec: "6GB+128GB",
        processor:"Qualcomm Snapdragon 665 Processor",
        price: 14645,
        category: "mobiles"
    },
    {
        name: 'mik20pro.jpg',
        brand: 'redmi K20 pro',
        spec: "6GB+128GB",
        processor:"Qualcomm Snapdragon 855 Processor",
        price: 24999,
        category: "mobiles"
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


MongoClient.connect(url,function(err,db){
    if(err) throw err;
    var dbo = db.db("Kishore");
    dbo.collection("carousel").remove();
    for(var i=0;i<carousel.length;i++){
        var base64 = fs.readFileSync(__dirname + '/assets/img/Caroussel/'+ carousel[i]+'')
        var query={
            name: carousel[i],
            data: base64
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
    var o_id = new ObjectId("5efefb8bec77111d586dfb93");
        var data ={
            description:[
                    {
                        "title": "processor",
                        "desc":"10th Generation Intel® Core™ i5",
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
                        "title":"conn",
                        "desc":"Wireless LAN:Dual-band 802.11ac Wi-Fi--Bluetooth:Bluetooth V5.0"
                    },
                    {
                        "title":"design",
                        "desc":"17.95mm--323mm--228mm--1.5kg--Thin and Light"
                    },
                    {
                        "title":"box",
                        "desc":"Mi Notebook 14 x 1U--Power Adapter with Power Cord x 1U--User Manual x 1U--Mi Webcam HD 720p x1U(Free with the Mi Notebook 14, will be given as a separate bundle)"
                    }
                ]
        }
        
                
        dbo.collection("products").update({"_id": o_id},data,function(err, result){
            if(err) throw err;
            console.log("inserted ")
        })
    })
*/
/*
MongoClient.connect(url,function(err,db){
    if(err) throw err;
    var dbo = db.db("Kishore");
    for(var i=0;i<laptop.length;i++){
        var base64 = fs.readFileSync(__dirname + '/assets/img/Laptops/'+ laptop[i].name+'')
        var query={
            name: laptop[i].brand,
            data: base64,
            price: laptop[i].price,
            category: laptop[i].category,
            description: laptop[i].description
        }
        dbo.collection("products").insertOne(query,function(err,result){
            if(err) throw err;
            console.log("inserted")
        })
    }
})*/
//mobiles
/*
MongoClient.connect(url,function(err,db){
    if(err) throw err;
    var dbo = db.db("Kishore");
    for(var i=0;i<mobiles.length;i++){
        var base64 = fs.readFileSync(__dirname + '/assets/img/mobiles/'+ mobiles[i].name+'')
        var query={
            name: mobiles[i].brand,
            data: base64,
            price: mobiles[i].price,
            category: mobiles[i].category,
        }
        dbo.collection("products").insertOne(query,function(err,result){
            if(err) throw err;
            console.log("inserted")
        })
    }
})
//tv
MongoClient.connect(url,function(err,db){
    if(err) throw err;
    var dbo = db.db("Kishore");
    for(var i=0;i<tv.length;i++){
        var base64 = fs.readFileSync(__dirname + '/assets/img/tv/'+ tv[i].name+'')
        var query={
            name: tv[i].brand,
            data: base64,
            price: tv[i].price,
            category: tv[i].category,
        }
        dbo.collection("products").insertOne(query,function(err,result){
            if(err) throw err;
            console.log("inserted")
        })
    }
})*/
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
    res.json({
        data: fs.readFileSync(__dirname + '/assets/img/Laptops/002.jpg','base64')
    })
})
app.listen(8080,()=> console.log('listening.....8080'))