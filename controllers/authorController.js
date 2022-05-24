import Author from '../models/author.js';
import Book from '../models/book.js';
import async from 'async';
import {body, validationResult} from 'express-validator';

export function author_list(req, res, next) {
  Author.find()
    .exec(function(err, list_authors) {
      if (err) return next(err);
      res.render('author_list', {
        title: 'Author List',
        author_list: list_authors
      });
    });
}

export function author_detail(req, res, next) {
  async.parallel({
    author: function(callback) {
      Author.findById(req.params.id)
        .exec(callback);
    },
    authors_books: function(callback) {
      Book.find(
        {'author': req.params.id},
        'title, summary'
      ).exec(callback);
    }
  }, function(err, results) {
    if (err) return next(err);
    if (results.author === null) {
      const err = new Error('Author not found');
      err.status = 404;
      return next(err);
    }
    res.render('author_detail', {
      title: 'Author Detail',
      author: results.author,
      authors_books: results.authors_books
    });
  });
}

export function author_create_get(req, res, next) {
  res.render('author_form', {title: 'Create Author'});
};

export const author_create_post = [
  // Validate and sanitize fields.
  body('first_name')
    .trim()
    .isLength({min: 1})
    .escape()
    .withMessage('First name must be specified.')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters.'),
  body('family_name')
    .trim()
    .isLength({min: 1})
    .escape()
    .withMessage('Family name must be specified.')
    .isAlphanumeric()
    .withMessage('Family name has non-alphanumeric characters.'),
  body('date_of_birth', 'Invalid date of birth')
    .optional({checkFalsy: true})
    .isISO8601()
    .toDate(),
  body('date_of_death', 'Invalid date of death')
    .optional({checkFalsy: true})
    .isISO8601()
    .toDate(),
  // Process request after validation and sanitization. 
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('author_form', {
        title: 'Create Author',
        author: req.body,
        errors: errors.array()
      });
      return;
    } else {
      const author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death
      });
      author.save(function(err) {
        if (err) return next(err);
        res.redirect(author.url);
      });
    }
  }
];

export function author_delete_get(req, res) {
  async.parallel({
    author: function(callback) {
        Author.findById(req.params.id).exec(callback)
    },
    authors_books: function(callback) {
        Book.find({ 'author': req.params.id }).exec(callback)
    },
  }, function(err, results) {
    if (err) { return next(err); }
    if (results.author==null) { // No results.
        res.redirect('/catalog/authors');
    }
    // Successful, so render.
    res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
  });
};

export function author_delete_post(req, res, next) {
  async.parallel({
    author: function(callback) {
      Author.findById(req.body.authorid)
        .exec(callback);
    },
    authors_books: function(callback) {
      Book.find({
        'author': req.body.authorid,
      }).exec(callback);
    }
  }, function(err, results) {
    if (err) return next(err);
    if (results.authors_books.length > 0) {
      // Author has books. Render in same way as for GET route.
      res.render('author_delete', {
        title: 'Delete Author',
        author: results.author,
        author_books: results.authors_books
      });
      return;
    } else {
      /* Author has no books.
      Delete object and redirect to the list of authors.*/
      Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
        if (err) return next(err);
        res.redirect('/catalog/authors')
      });
    }
  });
};

export function author_update_get(req, res) {
  res.send('NOT IMPLEMENTED: Author update GET');
};

export function author_update_post(req, res) {
  res.send('NOT IMPLEMENTED: Author update POST');
};

