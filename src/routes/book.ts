import { BookDetail } from "../models/book";
import { Router } from "express";
import { dbConfig } from "../config/db.config";
import { createConnection } from "mysql";

import * as bodyParser from 'body-parser';
import * as multer from 'multer';
import * as path from 'path';

const bookRouter: Router = Router();
const urlParser = bodyParser.json();

const UPLOAD_PATH = path.join(__dirname, '../uploads');
const localStroage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}.${getFileExtension(file.originalname)}`);
  }
});
const upload = multer({ storage: localStroage });

function getFileExtension(originalName: string): string {
  return originalName.split('.').pop();
}

bookRouter.get('/', (req, res) => {
  var term = req.query.searchTerm;
  var currentPage = parseInt(req.query.currentPage);
  var pageSize = parseInt(req.query.pageSize);

  const sql = 'select * from book';
  createConnection(dbConfig).query(sql, (err, books) => {
    if (err) return res.json({ code: 401, message: 'Get books failed!' });
    const searchResult = term ? books.filter( (book) => book.title.indexOf(term) >= 0) : books;
    const totalCount = searchResult.length;
    if (!currentPage && !pageSize) return  res.json({ books: searchResult, totalCount: totalCount });
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const finalResult = searchResult.slice(start, end);
    
    return  res.json({ books: finalResult, totalCount: totalCount });
  });
})

bookRouter.get('/detail/:id', (req, res) => {
  const sql = `select * from book where id=${req.params.id}`;
  createConnection(dbConfig).query(sql, (err, books) => {
    if (err) return  res.json({ code: 401, message: 'Get book detail failed!' });
    const book = books[0];
    return res.json(new BookDetail(book.id, book.title, book.author,  book.publisher, book.ISBN, book.coverName, book.coverSize, book.coverUrl, book.borrowerId));
  });
});

bookRouter.post('/add', upload.single('cover'), (req, res) => {
  const title = req.body.title;
  const author = req.body.author;
  const publisher = req.body.publisher;
  const ISBN = req.body.ISBN;
  const coverUrl = req.file ? `'http://localhost:8000/uploads/${req.file.filename}'` : 'null';
  const coverName = req.file ? `'${req.file.filename}'` : 'null';
  const coverSize = req.file ? req.file.size : 'null';

  const sql = `insert into book (title, author, publisher, ISBN, coverName, coverSize, coverUrl) values (
    '${title}', '${author}', '${publisher}', '${ISBN}', ${coverName}, ${coverSize}, ${coverUrl})`;
  createConnection(dbConfig).query(sql, (err) => { 
    if (err) {
      return res.json({ code: 401, message: 'Add book failed!' }); 
    }
    
    return res.json({ code: 200, message: 'Add book success!' });
  });
});

bookRouter.post('/save', upload.single('cover'), (req, res) => {
  const id = req.body.id;
  const title = req.body.title;
  const author = req.body.author;
  const publisher = req.body.publisher;
  const ISBN = req.body.ISBN;
  const coverUrl = req.file ? `'http://localhost:8000/uploads/${req.file.filename}'` : 'null';
  const coverName = req.file ? `'${req.file.filename}'` : 'null';
  const coverSize = req.file ? req.file.size : 'null';

  const sql = `update book set title='${title}', author='${author}', publisher='${publisher}', ISBN='${ISBN}', 
  coverUrl=${coverUrl}, coverName=${coverName}, coverSize=${coverSize} where id=${id}`;
  createConnection(dbConfig).query(sql, (err) => { 
    if (err) {
      return res.json({ code: 401, message: 'Save book failed!' }); 
    }

    return res.json({ code: 200, message: 'Save book success!' });  
  });
});

bookRouter.post('/delete', urlParser, (req, res) => {
  const id = req.body.id;
  const sql = `delete from book where id=${id}`;
  createConnection(dbConfig).query(sql, (err) => {
    if (err) return res.json({ code: 401, message: 'Delete book failed!' }); 
    return res.json({ code: 200, message: 'Delete book success!' });  
  })
})

bookRouter.post('/return', urlParser, (req, res) => {
  const id = req.body.id;
  const sql = `update book set borrowerId=null where id=${id}`;
  createConnection(dbConfig).query(sql, (err) => {
    if (err) return res.json({ code: 401, message: 'Return book failed!' }); 
    return res.json({ code: 200, message: 'Return book success!' });  
  })
})

export { bookRouter };