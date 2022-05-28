import mongoose from 'mongoose';
import {DateTime} from 'luxon';

const Schema = mongoose.Schema;

const BookInstanceSchema = new Schema({
  book: {
    type: Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  imprint: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'],
    default: 'Maintenance',
  },
  due_back: {
    type: Date,
    default: Date.now,
  },
});

BookInstanceSchema.virtual('due_back_formatted').get(function() {
  let formatted = '';
  if (this.due_back) {
    const y = this.due_back.getUTCFullYear();
    const m = this.due_back.getUTCMonth() + 1; // month is 0 based
    const d = this.due_back.getUTCDate();
    const y_str = y.toString();
    const m_str = (m >= 10) ? m.toString() : '0' + m.toString();
    const d_str = (d >= 10) ? d.toString() : '0' + d.toString();
    formatted = `${y_str}-${m_str}-${d_str}`;
  }
  return formatted;
});

BookInstanceSchema.virtual('url').get(function() {
  return '/catalog/bookinstance/' + this._id;
});


const BookInstance = mongoose.model('BookInstance', BookInstanceSchema);

export default BookInstance;