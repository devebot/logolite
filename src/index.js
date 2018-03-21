module.exports = global.logolite = {
	LogAdapter: require('./adapter'),
	LogTracer: require('./tracer'),
	LogConfig: require('./config'),
	MockLogger: require('./logmock')
}
