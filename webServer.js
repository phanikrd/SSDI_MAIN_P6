/**
 * This builds on the webServer of previous projects in that it exports the
 * current directory via webserver listing on a hard code (see portno below)
 * port. It also establishes a connection to the MongoDB named 'project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch
 * any file accessible to the current user in the current directory or any of
 * its children.
 *
 * This webServer exports the following URLs:
 * /            - Returns a text status message. Good for testing web server
 *                running.
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns the population counts of the cs collections in the
 *                database. Format is a JSON object with properties being the
 *                collection name and the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the
 * database:
 * /user/list         - Returns an array containing all the User objects from
 *                      the database (JSON format).
 * /user/:id          - Returns the User object with the _id of id (JSON
 *                      format).
 * /photosOfUser/:id  - Returns an array with all the photos of the User (id).
 *                      Each photo should have all the Comments on the Photo
 *                      (JSON format).
 */

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

const async = require("async");

const express = require("express");
const app = express();

// Load the Mongoose schema for User, Photo, and SchemaInfo
const User = require("./schema/user.js");
const Photo = require("./schema/photo.js");
const SchemaInfo = require("./schema/schemaInfo.js");

// XXX - Your submission should work without this line. Comment out or delete
// this line for tests and before submission!
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1/project6", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// We have the express static module
// (http://expressjs.com/en/starter/static-files.html) do all the work for us.
app.use(express.static(__dirname));

app.get("/", function (request, response) {
  response.send("Simple web server of files from " + __dirname);
});

/**
 * Use express to handle argument passing in the URL. This .get will cause
 * express to accept URLs with /test/<something> and return the something in
 * request.params.p1.
 * 
 * If implement the get as follows:
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns an object with the counts of the different collections
 *                in JSON format.
 */
app.get("/test/:p1", function (request, response) {
  // Express parses the ":p1" from the URL and returns it in the request.params
  // objects.
  console.log("/test called with param1 = ", request.params.p1);

  const param = request.params.p1 || "info";

  if (param === "info") {
    // Fetch the SchemaInfo. There should only one of them. The query of {} will
    // match it.
    SchemaInfo.find({}, function (err, info) {
      if (err) {
        // Query returned an error. We pass it back to the browser with an
        // Internal Service Error (500) error code.
        console.error("Error in /user/info:", err);
        response.status(500).send(JSON.stringify(err));
        return;
      }
      if (info.length === 0) {
        // Query didn't return an error but didn't find the SchemaInfo object -
        // This is also an internal error return.
        response.status(500).send("Missing SchemaInfo");
        return;
      }

      // We got the object - return it in JSON format.
      console.log("SchemaInfo", info[0]);
      response.end(JSON.stringify(info[0]));
    });
  } else if (param === "counts") {
    // In order to return the counts of all the collections we need to do an
    // async call to each collections. That is tricky to do so we use the async
    // package do the work. We put the collections into array and use async.each
    // to do each .count() query.
    const collections = [
      { name: "user", collection: User },
      { name: "photo", collection: Photo },
      { name: "schemaInfo", collection: SchemaInfo },
    ];
    async.each(
      collections,
      function (col, done_callback) {
        col.collection.countDocuments({}, function (err, count) {
          col.count = count;
          done_callback(err);
        });
      },
      function (err) {
        if (err) {
          response.status(500).send(JSON.stringify(err));
        } else {
          const obj = {};
          for (let i = 0; i < collections.length; i++) {
            obj[collections[i].name] = collections[i].count;
          }
          response.end(JSON.stringify(obj));
        }
      }
    );
  } else {
    // If we know understand the parameter we return a (Bad Parameter) (400)
    // status.
    response.status(400).send("Bad param " + param);
  }
});

/**
 * URL /user/list - Returns all the User objects.
 */
app.get("/user/list", function (request, response) {
  const projection = {
    _id:1,
    first_name:1,
    last_name:1
  };
    User.find({}, projection, function (err, userDetails) {
      if (err) {
        console.error("Error in /user/list:", err);
        response.status(500).send(JSON.stringify(err));
      } else if (userDetails.length === 0) {
        response.status(400).send("Missing user list");
      } else {
        response.end(JSON.stringify(userDetails));
      }
    });
});


/**
 * URL /user/:id - Returns the information for User (id).
 */
app.get("/user/:id", function (request, response) {
  const id = request.params.id;
  const projection = {
    _id:1,
    first_name:1,
    last_name:1,
    location:1,
    description:1,
    occupation:1
  };
  User.find({_id: id}, projection, function (err, userDetails) {
    if (err) {
      console.error("Error in /user/list:", err);
      response.status(500).send("err");
    } else if (userDetails.length === 0) {
      response.status(400).send("Missing user list");
    } else {
      for (var i = 0; i < userDetails.length; i++) {
        if (JSON.parse(JSON.stringify(userDetails[i]._id)) === id) {
           response.end(JSON.stringify(userDetails[i]));
        }
     }
    }
  });
});


/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
app.get("/photosOfUser/:id", function (request, response) {
  const id = request.params.id;
  Photo.aggregate([
    { $match:
          {user_id: {$eq: new mongoose.Types.ObjectId(id)}}
    },
    { $addFields: {
      comments: { $ifNull : ["$comments",[]]}
    } },
    { $lookup: {
        from: "users",
        localField: "comments.user_id",
        foreignField: "_id",
        as: "users"
      } },
    { $addFields: {
        comments: {
          $map: {
            input: "$comments",
            in: {
              $mergeObjects: [
                "$$this",
                { user: {
                    $arrayElemAt: [
                      "$users",
                      {
                        $indexOfArray: [
                          "$users._id",
                          "$$this.user_id"
                        ]
                      }
                    ]
                  } }
              ]
            }
          }
        }
      } },
    { $project: {
        users: 0,
        __v: 0,
        "comments.__v": 0,
        "comments.user_id": 0,
        "comments.user.location": 0,
        "comments.user.description": 0,
        "comments.user.occupation": 0,
        "comments.user.__v": 0
      } }
  ], function (err, photos) {
    if (err) {
      // Query returned an error. We pass it back to the browser with an
      // Internal Service Error (500) error code.
      console.error("Error in /photosOfUser/:id", err);
      response.status(500).send(JSON.stringify(err));
      return;
    }
    if (photos.length === 0) {
      // Query didn't return an error but didn't find the SchemaInfo object -
      // This is also an internal error return.
      response.status(400).send();
      return;
    }
    // We got the object - return it in JSON format.
    response.end(JSON.stringify(photos));
  });
});
const server = app.listen(3000, function () {
  const port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
      port +
      " exporting the directory " +
      __dirname
  );
});


