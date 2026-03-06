import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../config/firebase.js";

const pessoasCollection = collection(db, "pessoas");
const childrenCollection = collection(db, "children");
const childEventsCollection = collection(db, "childEvents");

async function uploadPessoaFoto(file, userId, pessoaId) {
  if (!file) {
    return null;
  }

  const photoRef = ref(storage, `pessoas/${userId}/${pessoaId}`);
  await uploadBytes(photoRef, file);
  return getDownloadURL(photoRef);
}

function sortByCreatedAtDesc(items) {
  return items.sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });
}

export async function createPessoa(userId, pessoaData, fotoFile) {
  const baseData = {
    nome: pessoaData.nome,
    telefone: pessoaData.telefone,
    responsavel: pessoaData.responsavel,
    info: pessoaData.info,
    foto: null,
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const pessoaRef = await addDoc(pessoasCollection, baseData);

  let fotoUrl = null;
  if (fotoFile) {
    fotoUrl = await uploadPessoaFoto(fotoFile, userId, pessoaRef.id);
    await updateDoc(pessoaRef, {
      foto: fotoUrl,
      updatedAt: serverTimestamp(),
    });
  }

  return {
    id: pessoaRef.id,
    ...baseData,
    foto: fotoUrl,
  };
}

export async function listPessoas(ownerId) {
  const pessoasQuery = query(pessoasCollection, where("ownerId", "==", ownerId));

  const snapshot = await getDocs(pessoasQuery);

  return sortByCreatedAtDesc(
    snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }))
  );
}

export function watchPessoas(ownerId, onData, onError) {
  const pessoasQuery = query(pessoasCollection, where("ownerId", "==", ownerId));

  return onSnapshot(
    pessoasQuery,
    (snapshot) => {
      const pessoas = sortByCreatedAtDesc(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );

      onData(pessoas);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}

export async function getPessoaById(id) {
  const pessoaRef = doc(db, "pessoas", id);
  const snapshot = await getDoc(pessoaRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function deletePessoa(id, ownerId) {
  const pessoaRef = doc(db, "pessoas", id);
  const snapshot = await getDoc(pessoaRef);

  if (!snapshot.exists()) {
    return;
  }

  const pessoa = snapshot.data();

  if (pessoa.ownerId && pessoa.ownerId !== ownerId) {
    throw new Error("Você não tem permissão para excluir este registro.");
  }

  await deleteDoc(pessoaRef);

  if (!pessoa.foto) {
    return;
  }

  const fotoRef = ref(storage, `pessoas/${ownerId}/${id}`);
  try {
    await deleteObject(fotoRef);
  } catch {
    // Ignore cleanup errors when file was already removed.
  }
}

function mapChildSnapshot(snapshot) {
  if (!snapshot) {
    return null;
  }

  const data = snapshot.data();

  return {
    id: snapshot.id,
    ownerId: data.ownerId,
    name: data.name || "",
    age: Number(data.age || 0),
    photo: data.photo || null,
    slug: data.slug || undefined,
    tagStatus: data.tagStatus || "active",
    guardians: Array.isArray(data.guardians)
      ? data.guardians.map((guardian) => ({
        name: guardian?.name || "",
        phone: guardian?.phone || "",
        whatsapp: Boolean(guardian?.whatsapp),
        principal: Boolean(guardian?.principal),
      }))
      : [],
    medicalInfo: {
      pcd: Boolean(data.medicalInfo?.pcd),
      healthPlans: data.medicalInfo?.healthPlans || "",
      otherInfo: data.medicalInfo?.otherInfo || "",
    },
  };
}

export function watchChildProfile(ownerId, onData, onError) {
  // legacy single-doc behavior retained for backwards compatibility
  const childRef = doc(db, "children", ownerId);
  const legacyQuery = query(childrenCollection, where("ownerId", "==", ownerId), limit(1));

  return onSnapshot(
    childRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        onData(mapChildSnapshot(snapshot));
        return;
      }

      try {
        const legacySnapshot = await getDocs(legacyQuery);
        const legacyDoc = legacySnapshot.docs[0];
        onData(legacyDoc ? mapChildSnapshot(legacyDoc) : null);
      } catch (error) {
        if (onError) {
          onError(error);
        }
      }
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
}

// new helper for monitoring all children belonging to a user
export function watchChildrenList(ownerId, onData, onError) {
  const q = query(childrenCollection, where("ownerId", "==", ownerId));
  return onSnapshot(
    q,
    (snapshot) => {
      const kids = snapshot.docs.map(mapChildSnapshot);
      onData(kids);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export async function saveChildProfile(ownerId, childData, childId) {
  // Ensure slugs do not expose child names. We generate a compact
  // identifier-only slug from the document id.
  const makeSlug = (idToken = '') => {
    const token = String(idToken)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return token ? `c-${token}` : `c-${Date.now().toString(36)}`;
  };

  if (childId) {
    // updates should not overwrite an existing slug unless the caller
    // explicitly passes a `slug` field in childData.
    const updatePayload = {
      ownerId,
      publicProfile: childData.publicProfile ?? true,
      ...childData,
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(
        doc(db, 'children', childId),
        updatePayload,
        { merge: true }
      );
      return childId;
    } catch (err) {
      console.error('saveChildProfile (update) failed', err);
      throw err;
    }
  } else {
    try {
      // create document first to obtain id for unique slug suffix
      const docRef = await addDoc(childrenCollection, {
        ownerId,
        publicProfile: childData.publicProfile ?? true,
        ...childData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // if the caller didn't provide a slug, generate one now
      if (!childData.slug) {
        const generated = makeSlug(docRef.id.slice(0, 12));
        await updateDoc(docRef, { slug: generated, updatedAt: serverTimestamp() });
      }

      return docRef.id;
    } catch (err) {
      console.error('saveChildProfile (create) failed', err);
      throw err;
    }
  }
}

export async function removeChildProfile(childId) {
  // simply delete the document by its id; authentication rules should
  // prevent unauthorized deletes on Firestore side.
  const childRef = doc(db, 'children', childId);
  await deleteDoc(childRef);
}

// helpers for slug lookup --------------------------------------------------
export async function getChildBySlug(ownerId, slug) {
  const q = query(
    childrenCollection,
    where('ownerId', '==', ownerId),
    where('slug', '==', slug),
    limit(1)
  );
  const snapshot = await getDocs(q);
  const docSnap = snapshot.docs[0];
  return docSnap ? mapChildSnapshot(docSnap) : null;
}

export async function getChildByPublicSlug(slug) {
  const q = query(
    childrenCollection,
    where('slug', '==', slug),
    limit(1)
  );
  const snapshot = await getDocs(q);
  const docSnap = snapshot.docs[0];
  return docSnap ? mapChildSnapshot(docSnap) : null;
}

export async function setChildTagStatus(childId, tagStatus) {
  await updateDoc(doc(db, "children", childId), {
    tagStatus,
    updatedAt: serverTimestamp(),
  });
}

function mapChildEventSnapshot(snapshot) {
  if (!snapshot) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ownerId: data.ownerId || '',
    type: data.type || 'scan',
    childId: data.childId || '',
    childName: data.childName || 'Criança',
    message: data.message || '',
    location: data.location || '',
    latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
    longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
    read: Boolean(data.read),
    timestamp: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
  };
}

export async function createChildEvent(ownerId, eventData) {
  const payload = {
    ownerId,
    type: eventData.type || 'scan',
    childId: eventData.childId || '',
    childName: eventData.childName || 'Criança',
    message: eventData.message || '',
    location: eventData.location || '',
    latitude: typeof eventData.latitude === 'number' ? eventData.latitude : null,
    longitude: typeof eventData.longitude === 'number' ? eventData.longitude : null,
    read: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const refDoc = await addDoc(childEventsCollection, payload);
  return refDoc.id;
}

export function watchChildEvents(ownerId, onData, onError) {
  const q = query(childEventsCollection, where('ownerId', '==', ownerId));
  return onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs
        .map(mapChildEventSnapshot)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      onData(events);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export async function markChildEventsAsRead(ownerId) {
  const q = query(childEventsCollection, where('ownerId', '==', ownerId), where('read', '==', false));
  const snapshot = await getDocs(q);
  await Promise.all(
    snapshot.docs.map((eventDoc) =>
      updateDoc(eventDoc.ref, {
        read: true,
        updatedAt: serverTimestamp(),
      })
    )
  );
}

export async function deleteChildEvent(eventId) {
  await deleteDoc(doc(db, "childEvents", eventId));
}

export async function deleteChildEvents(eventIds = []) {
  if (!Array.isArray(eventIds) || eventIds.length === 0) {
    return;
  }

  const batch = writeBatch(db);
  eventIds.forEach((eventId) => {
    batch.delete(doc(db, "childEvents", eventId));
  });
  await batch.commit();
}

export async function deleteAllChildEvents(ownerId) {
  const q = query(childEventsCollection, where('ownerId', '==', ownerId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return;
  }

  const batch = writeBatch(db);
  snapshot.docs.forEach((eventDoc) => {
    batch.delete(eventDoc.ref);
  });
  await batch.commit();
}

// ----- user settings helpers ------------------------------------------------
// Firestore security rules expect a `settings` collection, not `users`.
const settingsCollection = collection(db, "settings");

export async function saveUserSettings(ownerId, settings) {
  const settingsRef = doc(db, "settings", ownerId);
  try {
    await setDoc(
      settingsRef,
      {
        ...settings,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("saveUserSettings failed", err);
    throw err;
  }
}

export function watchUserSettings(ownerId, onData, onError) {
  const settingsRef = doc(db, "settings", ownerId);
  return onSnapshot(
    settingsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data());
      } else {
        onData(null);
      }
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}
