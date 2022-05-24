import mongoose from 'mongoose';

const mongoDB = 'mongodb+srv://shen:mongomongoose@library.gwvuc.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true})

export default db = mongoose.connection;

// Bind connection to error event
db.on('error', console.error.bind(console, 'MongoDB connection error:'));