import mongoose from 'mongoose';
import to from 'await-to-js';
import { mongoAuth } from '../keyfiles/mongo';

export async function connectMongo() {
	const ip = process.env.NODE_ENV.toLowerCase() === 'production' ? mongoAuth.ip : '127.0.0.1';

	// Connect to MongoDB
	const uri = `mongodb://${ip}/Primary?authSource=admin&w=1`;
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
