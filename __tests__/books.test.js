process.env.NODE_ENV = 'test';
const request = require('supertest');

const app = require('../app');
const db = require('../db');

let isbn;
// SET UP AND TEAR DOWN
beforeEach(async () => {
	const res = await db.query(`
        INSERT INTO books (
            isbn, 
            amazon_url,
            author,
            language,
            pages,
            publisher,
            title,
            year)   
        VALUES(
            '0691161518', 
            'http://a.co/eobPtX2', 
            'Matthew Lane', 
            'english', 
            264,  
            'Princeton University Press', 
            'Power-Up: Unlocking the Hidden Mathematics in Video Games', 
            2017) 
        RETURNING isbn`);
	isbn = res.rows[0].isbn;
});
afterEach(async () => {
	// delete any data created by test
	await db.query('DELETE FROM books');
});
afterAll(async () => {
	// close connection to db
	await db.end();
});
// SET UP AND TEAR DOWN ABOVE
// Actual tests are below
describe('GET /books', () => {
	test('should return {books:[book,...]} ', async () => {
		const res = await request(app).get('/books');
		expect(res.statusCode).toEqual(200);
		expect(res.body).toEqual({ books: expect.any(Array) });
	});
});

describe('GET /books/:isbn', () => {
	test('should find a book based on an isbn from the parameters', async () => {
		const res = await request(app).get(`/books/${isbn}`);
		expect(res.statusCode).toEqual(200);
		expect(res.body.book.isbn).toBe(isbn);
	});
	test('should error w/ 404 if not found', async () => {
		const res = await request(app).get(`/books/0`);
		expect(res.statusCode).toEqual(404);
	});
});

describe('POST /books', () => {
	test('should create a new book in the db and return the correct book info', async () => {
		const res = await request(app).post('/books').send({
			isbn       : '123',
			amazon_url : 'http://a.co/eobP2t42',
			author     : 'testAuthor',
			language   : 'english',
			pages      : 999,
			publisher  : 'testPublisher',
			title      : 'testTitle',
			year       : 2021
		});
		expect(res.statusCode).toBe(201);
		expect(res.body.book.isbn).toBe('123');
		expect(res.body.book.amazon_url).toBe('http://a.co/eobP2t42');
		expect(res.body.book.author).toBe('testAuthor');
		expect(res.body.book.language).toBe('english');
		expect(res.body.book.pages).toEqual(999);
		expect(res.body.book.publisher).toBe('testPublisher');
		expect(res.body.book.title).toBe('testTitle');
		expect(res.body.book.year).toEqual(2021);
	});
	test('should not be able to post a book, if there is no isbn', async () => {
		const res = await request(app).post('/books').send({
			amazon_url : 'http://a.co/eobP2t42',
			author     : 'testAuthor',
			language   : 'english',
			pages      : 999,
			publisher  : 'testPublisher',
			title      : 'testTitle',
			year       : 2021
		});
		expect(res.statusCode).toBe(400);
	});
	test('should not be able to post a book if there is no author', async () => {
		const res = await request(app).post('/books').send({
			isbn       : '123',
			amazon_url : 'http://a.co/eobP2t42',

			language   : 'english',
			pages      : 999,
			publisher  : 'testPublisher',
			title      : 'testTitle',
			year       : 2021
		});
		expect(res.statusCode).toBe(400);
	});
	test('should not be able to post a book if there is no language', async () => {
		const res = await request(app).post('/books').send({
			isbn       : '123',
			amazon_url : 'http://a.co/eobP2t42',
			author     : 'testAuthor',

			pages      : 999,
			publisher  : 'testPublisher',
			title      : 'testTitle',
			year       : 2021
		});
		expect(res.statusCode).toBe(400);
	});
	test('should not be able to post a book if there is no pages', async () => {
		const res = await request(app).post('/books').send({
			isbn       : '123',
			amazon_url : 'http://a.co/eobP2t42',
			author     : 'testAuthor',
			language   : 'english',

			publisher  : 'testPublisher',
			title      : 'testTitle',
			year       : 2021
		});
		expect(res.statusCode).toBe(400);
	});
	test('should not be able to post a book if there is no title', async () => {
		const res = await request(app).post('/books').send({
			isbn       : '123',
			amazon_url : 'http://a.co/eobP2t42',
			author     : 'testAuthor',
			language   : 'english',
			pages      : 999,
			publisher  : 'testPublisher',

			year       : 2021
		});
		expect(res.statusCode).toBe(400);
	});
	test('should not be able to post a book if there is no year', async () => {
		const res = await request(app).post('/books').send({
			isbn       : '123',
			amazon_url : 'http://a.co/eobP2t42',
			author     : 'testAuthor',
			language   : 'english',
			pages      : 999,
			publisher  : 'testPublisher',
			title      : 'testTitle'
		});
		expect(res.statusCode).toBe(400);
	});
});
describe('PUT /books/:isbn', () => {
	test('should update a book based on isbn', async () => {
		const res = await request(app).put(`/books/${isbn}`).send({
			author   : 'newAuthor',
			language : 'notEnglish',
			pages    : 9,
			title    : 'newTitle',
			year     : 2020
		});
		expect(res.statusCode).toEqual(200);
		expect(res.body.book.year).toEqual(2020);
		expect(res.body.book.pages).toEqual(9);
		expect(res.body.book.title).toBe('newTitle');
		expect(res.body.book.author).toBe('newAuthor');
		expect(res.body.book.language).toBe('notEnglish');
	});
	test('should not update a book if invalid isbn', async () => {
		const res = await request(app).put(`/books/0`).send({
			author   : 'newAuthor',
			language : 'notEnglish',
			pages    : 9,
			title    : 'newTitle',
			year     : 2020
		});
		expect(res.statusCode).toEqual(404);
	});
	test('should not update if isbn in body', async () => {
		const res = await request(app).put(`/books/${isbn}`).send({
			isbn     : isbn,
			author   : 'newAuthor',
			language : 'notEnglish',
			pages    : 9,
			title    : 'newTitle',
			year     : 2020
		});
		expect(res.statusCode).toEqual(400);
	});
});
describe('DELETE /books/:isbn', () => {
	test('should delete a book based on isbn', async () => {
		const res = await request(app).delete(`/books/${isbn}`);
		expect(res.body.message).toBe('Book deleted');
		expect(res.statusCode).toEqual(200);
	});
	test('should not do anything if isbn not found', async () => {
		const res = await request(app).delete(`/books/0`);
		expect(res.statusCode).toEqual(404);
	});
});
