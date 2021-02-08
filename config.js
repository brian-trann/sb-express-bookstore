/** Common config for bookstore. */
require('dotenv').config();

let DB_URI = `postgresql://`;
const SECRET_KEY = process.env.SECRET_KEY || 'secret';

if (process.env.NODE_ENV === 'test') {
	DB_URI = `${DB_URI}/books-test`;
} else {
	DB_URI = process.env.DATABASE_URL || `${DB_URI}/books`;
}

module.exports = { DB_URI, SECRET_KEY };
