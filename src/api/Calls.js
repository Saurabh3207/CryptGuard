import { firestore, app } from "../firebase";
import {
  generateKeys,
  encryptData,
  decryptData,
  encryptPrivateKey,
} from "./Crypto";

const users = firestore.collection("users");
const files = firestore.collection("files");
const groups = firestore.collection("groups");
const storage = app.storage();
const storageRef = storage.ref();

const verbose = false;

export const isUser = async (email) => {
  return new Promise((resolve) => {
    let ref = users.doc(email);
    ref.get().then(async (doc) => {
      if (doc.exists) resolve(true);
      else resolve(false);
    });
  });
};

export const getUser = (email, password) => {
  return new Promise((resolve) => {
    let ref = users.doc(email);
    ref.get().then(async (doc) => {
      if (doc.exists) {
        let userinfo = {
          keys: doc.data().keys,
          groups: doc.data().groups,
        };
        resolve(userinfo);
      } else {
        console.log("new user, generating keys for " + email);
        let pair = await generateKeys();
        if (verbose) console.log(pair);
        let encpair = await encryptPrivateKey(pair, password);
        let userinfo = {
          keys: encpair,
          groups: [],
        };
        users.doc(email).set(userinfo);
        resolve(userinfo);
      }
    });
  });
};

export const addUserFile = async (file, email, key, dupe) => {
  return new Promise(async (resolve) => {
    if (dupe) await deleteFile(dupe);
    let filename = email + "&^%" + file.name;
    const storageRef = app.storage().ref();
    const fileRef = storageRef.child(filename);
    let dataurlfile = await fileToDataUrl(file);
    let encdataurl = await encryptData(dataurlfile, key);
    fileRef.putString(encdataurl).then(() => {
      fileRef.getDownloadURL().then(async (url) => {
        files.add({
          owner: email,
          name: filename,
          url: url,
          group: false,
        });
        resolve();
      });
    });
  });
};

export const getUserFiles = async (email) => {
  let snapshot = await files.where("owner", "==", email).get();
  if (snapshot.empty) return;
  let fileArr = [];
  snapshot.forEach((doc) => {
    if (!doc.group) fileArr.push(createFileObj(doc));
  });
  return fileArr;
};

export const createGroup = async (email, name, password) => {
  return new Promise(async (resolve) => {
    let pair = await generateKeys();
    if (verbose) console.log(pair);
    let encpair = await encryptPrivateKey(pair, password);
    let group = { owner: email, name: name, keys: encpair };
    groups.add(group);
    resolve();
  });
};

// Function to add user to a group
export const addUserToGroup = async (email, groupID) => {
  return new Promise(async (resolve, reject) => {
    try {
      const groupRef = groups.doc(groupID);
      const groupDoc = await groupRef.get();
      if (!groupDoc.exists) {
        throw new Error("Group not found");
      }

      // Check if user is already a member of the group
      const userData = await getUser(email);
      if (userData.groups.includes(groupID)) {
        throw new Error("User is already a member of this group");
      }

      // Add group to user's groups array
      const userRef = users.doc(email);
      await userRef.update({
        groups: [...userData.groups, groupID],
      });

      resolve();
    } catch (error) {
      console.error("Error adding user to group:", error);
      reject(error);
    }
  });
};

// Function to manage user permissions within a group
export const manageGroupPermissions = async (groupId, userId, permissions) => {
  return new Promise(async (resolve, reject) => {
    try {
      const userRef = users.doc(userId);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      // Update user's permissions for the group
      const groupPermissions = {
        ...userDoc.data().groupPermissions,
        [groupId]: permissions,
      };
      await userRef.update({
        groupPermissions,
      });

      resolve();
    } catch (error) {
      console.error("Error managing group permissions:", error);
      reject(error);
    }
  });
};

export const deleteFile = async (file) => {
  return new Promise((resolve) => {
    let ref = storageRef.child(file.filename);
    ref
      .delete()
      .then(() => {
        files
          .doc(file.id)
          .delete()
          .then(() => resolve());
      })
      .catch(() => {
        files
          .doc(file.id)
          .delete()
          .then(() => resolve());
      });
  });
};

export const downloadFile = async (file, key) => {
  return new Promise(async (resolve) => {
    var reader = new FileReader();
    let data = await fetch(file.url);
    let blob = await data.blob();
    reader.readAsText(blob);
    reader.onload = async () => {
      let decdata = await decryptData(reader.result, key);
      let decfile = await dataUrlToFile(decdata.message);
      let fileurl = URL.createObjectURL(decfile);
      // window.open(fileurl);
      let a = document.createElement("a");
      a.href = fileurl;
      a.download = file.filename.split("&^%")[1];
      a.click();
      resolve();
    };
  });
};

export const dataUrlToFile = (dataurl, filename) => {
  return new Promise((resolve) => {
    var arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    resolve(new File([u8arr], filename, { type: mime }));
  });
};

export const fileToDataUrl = (file) => {
  return new Promise((resolve) => {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => resolve(reader.result);
  });
};

export const createFileObj = (doc) => {
  return {
    id: `${doc.id}`,
    owner: `${doc.data().owner}`,
    url: `${doc.data().url}`,
    filename: `${doc.data().name}`,
  };
};

export const createGroupObj = (doc) => {
  return {
    id: `${doc.id}`,
    owner: `${doc.data().owner}`,
    name: `${doc.data().name}`,
    keys: `${doc.data().keys}`,
  };
};

export const getUsersGroups = async (email) => {
  let snapshot = await groups.where("owner", "==", email).get();
  if (snapshot.empty) return;
  let grouparr = [];
  snapshot.forEach((doc) => grouparr.push(createGroupObj(doc)));
  return grouparr;
};
