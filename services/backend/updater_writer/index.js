const natsStreaming = require("node-nats-streaming");
const {
  updateStudent,
  updateMeta,
  updateAttainmentMeta
} = require("./updater/database_updater");
const logger = require("./logger");
const { initializeDatabaseConnection } = require("./database/connection");

initializeDatabaseConnection()
  .then(() => {
    const stan = natsStreaming.connect(
      "updaterNATS",
      process.env.HOSTNAME,
      process.env.NATS_URI
    );

    console.log(`STARTING WITH ${process.env.HOSTNAME} as id`);
    const opts = stan.subscriptionOptions();
    opts.setManualAckMode(true);
    opts.setAckWait(10 * 60 * 1000); // some students have taken over 5 min to write!
    // opts.setDeliverAllAvailable()
    // opts.setDurableName('durable')
    opts.setMaxInFlight(1);

    stan.on("connect", function() {
      const sub = stan.subscribe("UpdateWrite", "updater.workers", opts);
      const attSub = stan.subscribe(
        "UpdateAttainmentDates",
        "updater.workers.attainments",
        opts
      );
      const prioSub = stan.subscribe(
        "PriorityWrite",
        "updater.workers.prio",
        opts
      );

      const writeStudent = priority => async msg => {
        let data = null;
        try {
          const start = new Date();
          data = JSON.parse(msg.getData());
          if (data.task === "meta") {
            await updateMeta(data.data);
          } else {
            await updateStudent(data.data);
          }
          stan.publish(
            "status",
            JSON.stringify(
              { task: data.task, status: "DONE", timems: new Date() - start },
              priority
            ),
            err => {
              if (err) console.log(err);
            }
          );
        } catch (err) {
          console.log("update failed", data.task, err);
          logger.info("failure", { service: "WRITER" });
        }
        msg.ack();
      };

      sub.on("message", writeStudent(false));
      prioSub.on("message", writeStudent(true));

      attSub.on("message", async msg => {
        try {
          await updateAttainmentMeta();
          stan.publish(
            "status",
            JSON.stringify({ task: "attainment", status: "DONE" }),
            err => {
              if (err) {
                console.log("publish failed");
              }
            }
          );
        } catch (err) {
          console.log("attainment meta update failed", err);
          logger.info("failure", { service: "WRITER" });
        }
        msg.ack();
      });
    });
  })
  .catch(e => {
    process.exitCode = 1;
    console.log(e);
  });
