import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

type SeedUser = { email: string; name: string; password: string };

async function main() {
	const filePath = path.join(__dirname, 'default-users.json');
	const raw = fs.readFileSync(filePath, 'utf8');
	const users = JSON.parse(raw) as SeedUser[];

	const data = await Promise.all(
		users.map(async (u) => {
			const { email, name, password } = u || {};
			const hashedPassword = await bcrypt.hash(password, 10);
			return { email, name, password: hashedPassword };
		})
	);

	await prisma.user.createMany({
		data,
		skipDuplicates: true
	});
}

main()
	.catch(async (e) => {
		console.error(e);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
