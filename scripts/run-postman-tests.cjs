const newman = require("C:/Users/hp/AppData/Roaming/npm/node_modules/newman");
const path = require("path");

const collectionPath = path.resolve(__dirname, "../postman/SK_Baghel_Tour_and_Travels_Fare_System.postman_collection.json");
const environmentPath = path.resolve(__dirname, "../postman/Local_Development.postman_environment.json");

console.log("🚀 Starting Newman Postman Suite against http://localhost:4000 ...\n");

newman.run({
  collection: require(collectionPath),
  environment: require(environmentPath),
  reporters: ["cli"],
  bail: false
}, function (err, summary) {
  if (err) {
    console.error("❌ Newman execution error:", err);
    process.exit(1);
  }

  const failures = summary.run.failures;
  if (failures && failures.length > 0) {
    console.log(`\n⚠️ Tests completed with ${failures.length} failure(s).`);
  } else {
    console.log("\n✅ All Postman tests completed successfully!");
  }
});
