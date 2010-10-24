NODE = node

test: test_integration
	vows test/dialect_test.js --spec

test_integration:
	@$(NODE) test/integration_test.js
