import BookInstance from '../models/bookinstance.js';
import Book from '../models/book.js';
import {body, validationResult} from 'express-validator';
import async from 'async';
// import {redirect} from 'express/lib/response';

// Display list of all BookInstances.
export function bookinstance_list(req, res, next) {
  BookInstance.find()
    .populate('book')
    .exec(function(err, list_bookinstances) {
      if (err) return next(err);
      res.render('bookinstance_list', {
        title: 'Book Instance List',
        bookinstance_list: list_bookinstances
      });
    });
};

// Display detail page for a specific BookInstance.
export function bookinstance_detail(req, res, next) {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) return next(err);
      if (bookinstance === null) {
        const err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
      res.render('bookinstance_detail', {
        title: 'Copy: ' + bookinstance.book.title,
        bookinstance: bookinstance
      });
    })
};

// Display BookInstance create form on GET.
export function bookinstance_create_get(req, res, next) {
    Book.find({},'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
    });
};

const checklist = [
  body('book', 'Book must be specified')
  .trim()
  .isLength({min: 1})
  .escape(),
  body('imprint', 'Imprint must be specified.')
    .trim()
    .isLength({min: 1})
    .escape(),
  body('status', 'Status must be specified.')
    .optional({checkFalsy: true}),
  body('due_back', 'Invalid date')
    .optional({checkFalsy: true})
    .isISO8601()
    .toDate()
];

// Handle BookInstance create on POST.
export const bookinstance_create_post = [
    // Validate and sanitize fields.
    ...checklist,
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
                });
        }
    }
];

// Display BookInstance delete form on GET.
export function bookinstance_delete_get(req, res, next) {
  BookInstance.findById(req.params.id)
    .exec(function(err, bookinstance) {
      if (err) return next(err);
      if (bookinstance == null) {
        res.redirect('/catalog/bookinstances');
      } else {
        res.render('bookinstance_delete', {
          title: 'Delete Bookinstance',
          bookinstance: bookinstance
        });
      }
    });
};

// Handle BookInstance delete on POST.
export function bookinstance_delete_post(req, res, next) {
  BookInstance.findById(req.params.id)
    .exec(function(err, bookinstance) {
      if (err) return next(err);
      BookInstance.findByIdAndRemove(req.params.id, function deleteBookInstance(err) {
        if (err) next(err);
        res.redirect('/catalog/bookinstances');
      });
  });
};

// Display BookInstance update form on GET.
export function bookinstance_update_get(req, res, next) {
  async.parallel({
    bookinstance: function(callback) {
      BookInstance.findById(req.params.id)
        .exec(callback);
    },
    books: function(callback) {
      Book.find()
        .exec(callback);
    }
  }, function(err, results) {
    if (err) return next(err);
    if (results.bookinstance == null) {
      res.redirect('/catalog/bookinstances');
    } else {
      res.render('bookinstance_form', {
        title: 'Update book copy',
        bookinstance: results.bookinstance,
        book_list: results.books
      });
    }
  });
};

// Handle bookinstance update on POST.
export const bookinstance_update_post = [
  ...checklist,  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return bookinstance_update_get(req, res, next);
    }
    const newCopy = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id
    });
    BookInstance.findByIdAndUpdate(req.params.id, newCopy, {}, function(err, theCopy) {
      if (err) return next(err);
      res.redirect(theCopy.url);
    });
  }
];