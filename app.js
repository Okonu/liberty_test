const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require('mongoose-findorcreate');
//const myDate = require('./time_module');
const {
    redirect
} = require("express/lib/response");
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/AppDB");
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    username: String,
    Password: String,
});

const appSchema = new mongoose.Schema({
    name: String,
    //hint: String,
    userID: String

});

const saccoSchema = new mongoose.Schema({
    saccoName: String,
    saccoInfo: String,
    saccoStation: String,
    saccoCharge: String,
    appID: String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

userCollection = new mongoose.model("User", userSchema);
appCollection = new mongoose.model("App", appSchema);
saccoCollection = new mongoose.model("Sacco", saccoSchema);

passport.use(userCollection.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    userCollection.findById(id, function (err, user) {
        done(err, user);
    });
});

app.get("/", function (req, res) {
    if (req.isAuthenticated()) {

        appCollection.find({
            userID: req.user.id
        }, function (err, foundItems) {
            if (err) {
                console.log(err)
            } else {
                res.render("home", {
                    foundApps: foundItems,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName
                })
            }
        })
    } else {
        appCollection.find({
            userID: "622fed8b6bde50cfdb3ad7ad" //this is dummy data ID
        }, function (err, foundItems) {
            if (err) {
                console.log(err)
            } else {
                res.render("home", {
                    foundApps: foundItems,
                })
            }
        })
    }


});

app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/login", function (req, res) {
    const user = new userCollection({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/");
            })
        }
    })
});
app.get("/logout", function (req, res) {

    req.logout();
    res.redirect("/")
});
app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {
    userCollection.register({
        username: req.body.username
    }, req.body.password, function (err, user) {
        
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate('local')(req, res, function () {
                userCollection.update({
                    _id: req.user._id
                }, {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName
                }, function (err) {
                    if (err) {
                        console.log(err);
                    }
                })
                res.redirect("/");
            })
        }
    })
});

app.get("/add_item", function (req, res) {

    if (req.isAuthenticated()) {
        res.render("add_item", {
            firstName: req.user.firstName,
            lastName: req.user.lastName
        })
    } else {
        res.render("add_item")
    }

});


app.post("/add_item", function (req, res) {
    if (req.isAuthenticated()) {
        if (req.body.addedTitle.length >= 3) {
            appCollection.insertMany([{
                name: req.body.addedTitle,
                hint: "",
                userID: req.user.id
            }], function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully added to App");
                    res.redirect("/")
                }
            })
        } else {
            res.redirect("/")
        }
    } else {
        res.redirect("/login");
    }
});

app.get("/apps/:appName", function (req, res) {


    if (req.isAuthenticated()) {
        appCollection.find({
            userID: req.user.id,
            name: req.params.appName
        }, function (err, foundApp) { 
           

            saccoCollection.find({
                appID: foundApp[0]._id.valueOf()
            }, function (err, foundItems) {
                if (err) {
                    console.log(err);
                } else {
                    var saccosToAdd = [];
                    foundItems.forEach(item => {
                        saccosToAdd.push({
                            title: item.saccoName,
                            url: "/apps/" + req.params.appName + "/" + item._id + "/sacco"
                        })
                    });
                    
                    res.render("serve", {
                        appTitle: req.params.appName,
                        firstName: req.user.firstName,
                        lastName: req.user.lastName,
                        foundSaccos: saccosToAdd
                    });
                }
            });
        })
    } else {
        appCollection.find({
            userID: "622fed8b6bde50cfdb3ad7ad",
            name: req.params.appName
        }, function (err, foundApp) { 
            

            saccoCollection.find({
                appID: foundApp[0]._id.valueOf()
            }, function (err, foundItems) {
                if (err) {
                    console.log(err);
                } else {
                    var saccosToAdd = [];
                    foundItems.forEach(item => {
                        saccosToAdd.push({
                            title: item.saccoName,
                            url: "/apps/" + req.params.appName + "/" + item._id + "/sacco"
                        })
                    });
                    
                    res.render("serve", {
                        appTitle: req.params.appName,
                        foundSaccos: saccosToAdd
                    });
                }
            });
        })
    }

});

app.get("/apps/:appName/:saccoId/sacco", function (req, res) {
    if (req.isAuthenticated()) {
        appCollection.find({
            userID: req.user.id,
            name: req.params.appName
        }, function (err, foundApp) { 
            
            saccoCollection.find({
                _id: req.params.saccoId
            }, function (err, foundItems) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("saccos_view", {
                        firstName: req.user.firstName,
                        lastName: req.user.lastName,
                        foundSaccos: foundItems
                    });
                }

            })
        })
    } else {
        appCollection.find({
            userID: "622fed8b6bde50cfdb3ad7ad",
            name: req.params.appName
        }, function (err, foundApp) { 
            
            saccoCollection.find({
                _id: req.params.saccoId
            }, function (err, foundItems) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("saccos_view", {
                        foundSaccos: foundItems
                    });
                }

            })
        })
    }
});


app.get("/apps/:appName/saccos/", function (req, res) {
    if (req.isAuthenticated()) {
        appCollection.find({
            userID: req.user.id,
            name: req.params.appName
        }, function (err, foundApp) { 
            
            saccoCollection.find({
                appID: foundApp[0]._id.valueOf()
            }, function (err, foundItems) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("saccos_view", {
                        firstName: req.user.firstName,
                        lastName: req.user.lastName,
                        foundSaccos: foundItems
                    });
                }

            })
        })
    } else {
        appCollection.find({
            userID: "622fed8b6bde50cfdb3ad7ad",
            name: req.params.appName
        }, function (err, foundApp) { 
            
            saccoCollection.find({
                appID: foundApp[0]._id.valueOf()
            }, function (err, foundItems) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("saccos_view", {
                        foundSaccos: foundItems
                    });
                }

            })
        })
    }
});


app.get("/:appName/sacco-submission", function (req, res) {
    if (req.isAuthenticated()) {
        res.render('sacco-submission', {
            appTitle: req.params.appName,
            firstName: req.user.firstName,
            lastName: req.user.lastName
        });
    } else {
        res.render('sacco-submission', {
            appTitle: req.params.appName,
        });
    }

});
app.post("/:appName/sacco-submission", function (req, res) {
    if (req.isAuthenticated()) {

        appCollection.find({
            userID: req.user.id,
            name: req.params.appName
        }, function (err, foundApp) {
            saccoCollection.insertMany([{
                saccoName: req.body.saccoName,
                saccoInfo: req.body.saccoInfo,
                saccoStation: req.body.saccoStation,
                saccoCharge: req.body.saccoCharge,
                appID: foundApp[0]._id.valueOf()
            }])
            res.redirect("/apps/" + req.params.appName);
        });

    } else {
        res.redirect("/register");
    }
})

app.get("/update/:saccoId/sacco_edit", function (req, res) {
    saccoCollection.findById(req.params.saccoId, function (err, foundSacco) {
        res.render("sacco_edit", {
            saccoId: req.params.saccoId,
            sacco: foundSacco,
            
        })
    })
});

app.post("/:saccoId/sacco-update", function (req, res) {
    if (req.isAuthenticated()) {
        saccoCollection.updateOne({
            _id: req.params.saccoId
        }, {
            saccoName: req.body.saccoName,
            saccoInfo: req.body.saccoInfo,
            saccoStation: req.body.saccoStation,
            saccoCharge: req.body.saccoCharge,
        }, function (err) {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/")
            }
        })

    } else {
        res.redirect("/register")
    }
});



app.post("/update/:saccoId", function (req, res) {
    if (req.isAuthenticated()) {
        if (req.body.update == "delete") {
            backURL = req.header('Referer') || '/';
            saccoCollection.deleteOne({
                _id: req.params.saccoId
            }, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect(backURL)
                }
            })
        } else if (req.body.update == "edit") {
            res.redirect(req.params.saccoId + "/sacco_edit")
        }

    } else {
        if (req.body.update == "delete") {
            res.redirect("/register")
        } else {
            res.redirect(req.params.saccoId + "/sacco_edit")
        }
       
    }
})

app.get("/apps/:appName/delete", function(req, res){
    res.render("app-delete", {
        appName: req.params.appName

    })
})
app.post("/apps/:appName/delete", function(req, res){
    if(req.isAuthenticated()){        
        appCollection.deleteOne({name: req.params.appName, userID: req.user.id}, function(err, result){
            if (err) {
                res.send(err);
              } else {
                res.redirect("/");
              }
        });
    } else {
        res.redirect("/register")
    }
    

    
})

app.listen(3000, function () {
    console.log("App Management Server Started on Port 3000!")
})