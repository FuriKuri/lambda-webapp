console.log('Loading event');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();

exports.handler = function(event, context) {
  var vote = event.vote.toUpperCase().trim();
  if (['GOOD', 'OK', 'BAD'].indexOf(vote) >= 0) {
    voteHash = vote + "." + Math.floor((Math.random() * 10) + 1).toString();
    var tableName = 'VoteApp';
    dynamodb.updateItem({
      'TableName': tableName,
      'Key': { 'VotedFor' : { 'S': voteHash }},
      'UpdateExpression': 'add #vote :x',
      'ExpressionAttributeNames': {'#vote' : 'Votes'},
      'ExpressionAttributeValues': { ':x' : { "N" : "1" } }
    }, function(err, data) {
      if (err) {
        console.log(err);
        context.fail(err);
      } else {
        context.done(null, {
          message: "Thank you for casting a vote for " + vote
        });
        console.log("Vote received for %s", vote);
      }
    });
  } else {
    console.log("Invalid vote received (%s)", vote);
    context.fail("Invalid vote received");
  }
}
