import { Document, FindCursor, MongoClient, WithId } from 'mongodb';

const uri = process.env.MONGODB_URI!;
export const mongo = new MongoClient(uri);

export function pick<
  OriginalDocument extends Document,
  K extends keyof OriginalDocument,
>(cursor: FindCursor<WithId<OriginalDocument>>, keys: K[]) {
  return cursor.project<Pick<OriginalDocument, K>>(
    Object.fromEntries(keys.map((key) => [key, true])),
  );
}
