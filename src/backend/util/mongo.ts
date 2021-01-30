import mongoose from 'mongoose';
import to from 'await-to-js';
import { mongoAuth } from '../keyfiles/mongo';

export async function connectMongo() {
	// Connect to MongoDB
	const uri = `mongodb://127.0.0.1/Primary?authSource=admin&w=1`;
	const [e, r] = await to(
		mongoose.connect(uri, {
			user: mongoAuth.user,
			pass: mongoAuth.password,
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
	);

	if (e) {
		console.log(e);
		throw e;
	}
	if (r) console.log(`Successfully connected to MongoDB at ${uri}`);
}
