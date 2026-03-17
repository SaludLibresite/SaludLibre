import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    QueryConstraint,
    DocumentData,
    FirestoreDataConverter,
    Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Base Repository implementation for Firestore (client SDK).
 * Each module extends this with its own converter and collection name.
 *
 * The converter handles mapping between Domain Entities (Date) and
 * Firestore Data (Timestamp), keeping the domain layer Firebase-free.
 */
export abstract class BaseRepository<T extends { id: string }> {
    protected abstract collectionName: string;
    protected abstract converter: FirestoreDataConverter<T>;

    protected getCollection() {
        return collection(db, this.collectionName).withConverter(this.converter);
    }

    protected docRef(id: string) {
        return doc(db, this.collectionName, id).withConverter(this.converter);
    }

    async findById(id: string): Promise<T | null> {
        const snap = await getDoc(this.docRef(id));
        return snap.exists() ? snap.data() : null;
    }

    async findAll(constraints: QueryConstraint[] = []): Promise<T[]> {
        const q = query(this.getCollection(), ...constraints);
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data());
    }

    async findWhere(field: string, value: unknown): Promise<T[]> {
        return this.findAll([where(field, '==', value)]);
    }

    async findFirst(field: string, value: unknown): Promise<T | null> {
        const results = await this.findAll([where(field, '==', value), limit(1)]);
        return results[0] ?? null;
    }

    async save(entity: T): Promise<void> {
        await setDoc(this.docRef(entity.id), entity);
    }

    /** Insert with auto-generated Firestore ID. Returns the new ID. */
    async add(entity: T): Promise<string> {
        const ref = doc(this.getCollection());
        await setDoc(ref, { ...entity, id: ref.id } as T);
        return ref.id;
    }

    async update(id: string, data: Partial<T>): Promise<void> {
        await updateDoc(this.docRef(id), data as DocumentData);
    }

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, this.collectionName, id));
    }

    // --- Helpers for subclasses ---

    protected whereConstraint(field: string, value: unknown) {
        return where(field, '==', value);
    }

    protected orderByConstraint(field: string, direction: 'asc' | 'desc' = 'asc') {
        return orderBy(field, direction);
    }

    protected limitConstraint(count: number) {
        return limit(count);
    }

    /** Convert a JS Date to Firestore Timestamp */
    protected static toTimestamp(date: Date): Timestamp {
        return Timestamp.fromDate(date);
    }

    /** Convert a Firestore Timestamp to JS Date */
    protected static toDate(ts: Timestamp | null | undefined): Date {
        return ts?.toDate() ?? new Date(0);
    }

    /** Convert a Firestore Timestamp to Date or null */
    protected static toDateOrNull(ts: Timestamp | null | undefined): Date | null {
        return ts?.toDate() ?? null;
    }
}
