import mongoose from 'mongoose';
// import {DateTime} from 'luxon';

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  family_name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  date_of_birth: Date,
  date_of_death: Date,
});

AuthorSchema.virtual('name').get(function() {
  let fullname = '';
  if (this.first_name && this.family_name) {
    fullname = this.first_name + ', ' + this.family_name;
  }
  return fullname;
});

function formatDate(date) {
  let formatted = '';
  if (date) {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1; // month is 0 based
    const d = date.getUTCDate();
    const y_str = y.toString();
    const m_str = (m >= 10) ? m.toString() : '0' + m.toString();
    const d_str = (d >= 10) ? d.toString() : '0' + d.toString();
    formatted = `${y_str}-${m_str}-${d_str}`;
  }
  return formatted;
}

AuthorSchema.virtual('birthday_str').get(function() {
  return formatDate(this.date_of_birth);
});

AuthorSchema.virtual('deathday_str').get(function() {
  return formatDate(this.date_of_death);
});

AuthorSchema.virtual('lifespan').get(function() {
  let lifespan = '';
  if (this.date_of_birth) {
    lifespan = formatDate(this.date_of_birth) + ' ~ ';
  }
  if (this.date_of_death) {
    lifespan += formatDate(this.date_of_death);
  }
  return lifespan;
});

AuthorSchema.virtual('url').get(function() {
  return '/catalog/author/' + this._id;
});

const Author = mongoose.model('Author', AuthorSchema);

export default Author;