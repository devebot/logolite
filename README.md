# logolite

> Lite Logging Adapter

## Environment variables

* `LOGOLITE_INSTANCE_ID`: (UUID string) instance ID of runtime;
* `LOGOLITE_INFO_MESSAGE`: (string) Value of `message` field in libraryInfo logging object (default: "Application Information");
* `LOGOLITE_DEFAULT_SCOPE`: (string) default scope for `debug` module (DEBUG=`debug_scopes`);
* `LOGOLITE_MAXLEVEL`: (string) the maximum level that will be displayed;
* `LOGOLITE_DEBUGLOG`: (true/false) forces using `debug` module to render logging message (default: false);
* `LOGOLITE_SAFE_STRINGIFY`: (true/false) run JSON.stringify() inside try...catch block (default true);
* `LOGOLITE_BASE64_UUID`: (true/false) enable/disable base64 UUID format (default true);

