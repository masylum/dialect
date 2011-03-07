NODE = node

test: test_dialect

test_dialect:
	@$(NODE) test/dialect.js
