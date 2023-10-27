"use strict";

const assert = require("assert");
const http = require("http");
const async = require("async");
const _ = require("lodash");
const fs = require("fs");

const models = require("../modelData/photoApp.js").models;

const port = 3000;
const host = "localhost";

const userListProperties = ["first_name", "last_name", "_id"];
const userDetailProperties = [
  "first_name",
  "last_name",
  "_id",
  "location",
  "description",
  "occupation",
];
const photoProperties = ["file_name", "date_time", "user_id", "_id", "comments"];
const commentProperties = ["comment", "date_time", "_id", "user"];

function assertEqualDates(d1, d2) {
  assert(new Date(d1).valueOf() === new Date(d2).valueOf());
}

function removeMongoProperties(model) {
  return model;
}

describe("Photo App: Web API Tests", function () {
  // ... (Existing tests)

  describe("test /commentsOfUser/:id", function (done) {
    let userList;
    const Users = models.userListModel();

    it("can get the list of user", function (done) {
      http.get(
          {
            hostname: host,
            port: port,
            path: "/user/list",
          },
          function (response) {
            let responseBody = "";
            response.on("data", function (chunk) {
              responseBody += chunk;
            });

            response.on("end", function () {
              assert.strictEqual(
                  response.statusCode,
                  200,
                  "HTTP response status code not OK"
              );
              userList = JSON.parse(responseBody);
              done();
            });
          }
      );
    });

    it("can get each user's comments with /commentsOfUser/:id", function (done) {
      async.each(
          Users,
          function (realUser, callback) {
            const user = _.find(userList, {
              first_name: realUser.first_name,
              last_name: realUser.last_name,
            });
            assert(
                user,
                "could not find user " +
                realUser.first_name +
                " " +
                realUser.last_name
            );
            const id = user._id;
            http.get(
                {
                  hostname: host,
                  port: port,
                  path: `/commentsOfUser/${id}`,
                },
                function (response) {
                  let responseBody = "";
                  response.on("data", function (chunk) {
                    responseBody += chunk;
                  });
                  response.on("error", function (err) {
                    callback(err);
                  });

                  response.on("end", function () {
                    assert.strictEqual(
                        response.statusCode,
                        200,
                        "HTTP response status code not OK"
                    );
                    const comments = JSON.parse(responseBody);

                    const realComments = models.commentsOfUserModel(realUser._id);

                    assert.strictEqual(
                        realComments.length,
                        comments.length,
                        "wrong number of comments returned"
                    );

                    _.forEach(realComments, function (realComment) {
                      const matches = _.filter(comments, {
                        comment: realComment.comment,
                      });
                      assert.strictEqual(
                          matches.length,
                          1,
                          "looking for comment " + realComment.comment
                      );
                      const comment = matches[0];

                      const extraProps1 = _.difference(
                          Object.keys(removeMongoProperties(comment)),
                          commentProperties
                      );
                      assert.strictEqual(
                          extraProps1.length,
                          0,
                          "comment object has extra properties: " + extraProps1
                      );
                      assertEqualDates(comment.date_time, realComment.date_time);

                      const extraProps2 = _.difference(
                          Object.keys(removeMongoProperties(comment.user)),
                          userListProperties
                      );
                      assert.strictEqual(
                          extraProps2.length,
                          0,
                          "comment user object has extra properties: " + extraProps2
                      );
                      assert.strictEqual(
                          comment.user.first_name,
                          realComment.user.first_name
                      );
                      assert.strictEqual(
                          comment.user.last_name,
                          realComment.user.last_name
                      );

                      // Additional checks for the new features
                      assert.strictEqual(
                          comment.photo_id,
                          realComment.photo_id,
                          "photo_id doesn't match"
                      );
                    });

                    callback();
                  });
                }
            );
          },
          function (err) {
            done();
          }
      );
    });

    it("can return a 400 status on an invalid id to commentsOfUser", function (done) {
      http.get(
          {
            hostname: host,
            port: port,
            path: "/commentsOfUser/6528caac38bad49b8eceed6a",
          },
          function (response) {
            let responseBody = "";
            response.on("data", function (chunk) {
              responseBody += chunk;
            });

            response.on("end", function () {
              assert.strictEqual(response.statusCode, 400);
              done();
            });
          }
      );
    });
  });
});
