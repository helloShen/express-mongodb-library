import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const GenreSchema = new Schema({
  name: String,
});

GenreSchema.virtual('url').get(function() {
  return '/catalog/genre/' + this._id;
});

const Genre = mongoose.model('Genre', GenreSchema);

export default Genre;