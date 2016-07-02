console.log('Loading event');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();

exports.handler = function(event, context) {

    var totalGood = 0;
    var totalOk = 0;
    var totalBad = 0;

    event.Records.forEach(function(record) {
        var voteHash = record.dynamodb['NewImage']['VotedFor']['S'];
        var numVotes = record.dynamodb['NewImage']['Votes']['N'];
        var oldNumVotes = 0;
        if (record.dynamodb['OldImage']
              && record.dynamodb['OldImage']['Votes']
              && record.dynamodb['OldImage']['Votes']['N']) {
          oldNumVotes = record.dynamodb['OldImage']['Votes']['N'];
        }

        if (voteHash.indexOf("GOOD") > -1) {
            vote = "GOOD";
            totalGood += parseInt(numVotes) - parseInt(oldNumVotes);
        } else if (voteHash.indexOf("OK") > -1) {
            vote = "OK";
            totalOk +=  parseInt(numVotes) - parseInt(oldNumVotes);
        } else if (voteHash.indexOf("BAD") > -1) {
            vote = "BAD";
            totalBad += parseInt(numVotes) - parseInt(oldNumVotes);
        } else {
            console.log("Invalid vote: ", voteHash);
        }
    });

    var aggregatesTable = 'VoteAppAggregates';
    if (totalGood > 0) updateAggregate("GOOD", totalGood);
    if (totalOk > 0) updateAggregate("OK", totalOk);
    if (totalBad > 0) updateAggregate("BAD", totalBad);

    function updateAggregate(vote, numVotes) {
        console.log("Updating Aggregate Color ", vote);
        console.log("For NumVotes: ", numVotes);

        dynamodb.updateItem({
            'TableName': aggregatesTable,
            'Key': { 'VotedFor' : { 'S': vote }},
            'UpdateExpression': 'add #vote :x',
            'ExpressionAttributeNames': {'#vote' : 'Vote'},
            'ExpressionAttributeValues': { ':x' : { "N" : numVotes.toString() } }
        }, function(err, data) {
            if (err) {
                console.log(err);
                context.fail("Error updating Aggregates table: ", err)
            } else {
                console.log("Vote received for %s", vote);
                context.succeed("Successfully processed " + event.Records.length + " records.");
            }
        });
    }
};
