import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import type { Artifact } from '../../types/schema';

export class ArtifactRepository {
  private static collectionName = 'artifacts';

  /**
   * List all artifacts for an application
   */
  static async listArtifacts(applicationId: string): Promise<Artifact[]> {
    const q = query(
      collection(db, this.collectionName),
      where('applicationId', '==', applicationId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Artifact);
  }

  /**
   * Retrieve an artifact by ID
   */
  static async getArtifact(id: string): Promise<Artifact | null> {
    const docRef = doc(db, this.collectionName, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? (snapshot.data() as Artifact) : null;
  }

  /**
   * Filter artifacts by type
   */
  static async filterByType(applicationId: string, type: string): Promise<Artifact[]> {
    const q = query(
      collection(db, this.collectionName),
      where('applicationId', '==', applicationId),
      where('type', '==', type)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Artifact);
  }

  /**
   * Filter artifacts by feature
   */
  static async filterByFeature(applicationId: string, featureId: string): Promise<Artifact[]> {
    const q = query(
      collection(db, this.collectionName),
      where('applicationId', '==', applicationId),
      where('featureId', '==', featureId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Artifact);
  }

  /**
   * Filter artifacts by client
   */
  static async filterByClient(applicationId: string, clientId: string): Promise<Artifact[]> {
    const q = query(
      collection(db, this.collectionName),
      where('applicationId', '==', applicationId),
      where('clientId', '==', clientId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Artifact);
  }
}
