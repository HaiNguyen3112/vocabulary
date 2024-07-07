import React, { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebaseConfig";

const ImageUpload: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [url, setUrl] = useState<string>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (image) {
      const imageRef = ref(storage, `images/${image.name}`);
      uploadBytes(imageRef, image).then((snapshot) => {
        getDownloadURL(snapshot.ref).then((downloadURL) => {
          setUrl(downloadURL);
        });
      });
    }
  };
  console.log("url: ", url);

  return (
    <div>
      <input type="file" onChange={handleImageChange} />
      <button onClick={handleUpload}>Upload</button>
      <br />
      {url && <img src={url} alt="Uploaded" />}
    </div>
  );
};

export default ImageUpload;
