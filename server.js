var axios = require("axios");
var cheerio = require("cheerio");
var mongojs = require('mongojs')
var db = mongojs("Adetomi_DB", ['Artnet']);

var Note = require('./models/Note.js');
var Article = require('./models/Article.js');

var path = require('path');

var express = require("express");
var app = express();
var exphbs = require("express-handlebars");
app.use(express.json());


var PORT = 9040;
var mysql = require("mysql");

app.use(express.static("/public"));

app.engine("handlebars", exphbs({ defaultLayout: "defualt", 
partialsDir: path.join(__dirname, "/views/layouts/partials") 
}));
app.set("view engine", "handlebars");

axios.get("https://news.artnet.com/").then(function(response) {
    // console.log(response);
    var $ = cheerio.load(response.data);
    $("article.teaser").each(function(i, element){
        var header = $(element).children(".teaser-info").children("a").children("h2.teaser-title").text();
        //var header = $(element).find("h5.teaser-category").text() 
        var image = $(element).children().closest("a").children().closest("div").children().attr("src");
        // var image = $(element).find(".image-wrapper img")
        var link = $(element).children(".teaser-info").children("a").attr("href");
        // var link = $(element).find("h2.teaser-title").attr("href");

        console.log(header);
        console.log(link);
        console.log(image);

    db.Artnet.insert({
        "image": image,
        "header": header,
        "link": link

        
    });
});
});

app.get("/artnet/get", function(req, res){
console.log("enter artnet get")
    //1. MongoCall
    //2. Return HTML
    db.Artnet.find(function (err, docs) {
        // res.json(docs);
        // console.log(docs);
        console.log("akjdbjabkdbbfakj")
        console.log(docs);
        let hbsObject = {data: docs}
        res.render("index", hbsObject);
    });
});

//======== New========//

app.get("/", function(req,res){
	Article.find({"saved": false}).limit(20).exec(function(error,data){
		var hbsObject = {
			article: data
		};
		console.log(hbsObject);
        //res.render("home", hbsObject);
        res.render("index", hbsObject);
	});
});


app.get("/saved", function(req,res){
	Article.find({"saved": true}).populate("notes").exec(function(error, articles){
		var hbsObject = {
			article: articles
		};
		res.render("saved", hbsObject);
	});
});

app.get("/articles", function(req,res){
	Article.find({}).limit(20).exec(function(error, doc){
		if(error){
			console.log(error);
		}
		else{
			res.json(doc);
		}
	});
});

app.get("/articles/:id", function(req,res){
	Article.findOne({ "_id": req.params.id})
	.populate("note")
	.exec(function(error, doc){
		if(error){
			console.log(error);
		}
		else{
			res.json(doc);
		}
	});
});

app.post("/articles/save/:id", function(req,res){
	Article.findOneAndUpdate({ "_id": req.params.id}, {"saved": true})
	.exec(function(err, doc){
		if(err){
			console.log(err);
		}
		else{
			res.send(doc);
		}
	});
});

app.post("/articles/delete/:id", function(req,res){
	Article.findOneAndUpdate({ "_id": req.params.id}, {"saved": false, "notes":[]})
	.exec(function(err, doc){
		if(err){
			console.log(err);
		}
		else{
			res.send(doc);
		}
	});
});

app.post("notes/save/:id", function(req,res){
	var newNote = new Note({
		body: req.body.text,
		article: req.params.id
	});
	console.log(req.body)
	newNote.save(function(error, note){
		if(error){
			console.log(error);
		}
		else{
			Article.findOneAndUpdate({ "_id": req.params.id}, {$push: { "notes": note } })
			.exec(function(err){
				if(err){
					console.log(err);
					res.send(err);
				}
				else{
					res.send(note);
				}
			});
		}
	});
});

app.delete("/notes/delete/:note_id/:article", function(req,res){
	Note.findOneAndRemove({"_id": req.params.note.id}, function(err){
		if(err){
			console.log(err);
			res.send(err);
		}
		else{
			Article.findOneAndUpdate({"_id": req.params.article_id}, {$pull: {"notes": req.params.note_id}})
				.exec(function(err){
					if(err){
						console.log(err);
						res.send(err); 
					}
					else{
						res.send("Note Deleted");
					}
				});
		}
	});
});

//======== New========//

    app.listen(PORT, function() {
        console.log("App listening on PORT" + PORT);
});