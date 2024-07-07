import React, { useEffect, useState } from "react";
import { db, storage } from "../../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

const ImageUpload: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [url, setUrl] = useState<string>("");
  const [preview, setPreview] = useState<string>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0];
      setImage(selectedImage);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedImage);
    }
  };

  const handleUpload = async () => {
    if (image) {
      const imageRef = ref(storage, `images/${image.name}`);
      await uploadBytes(imageRef, image);
      const downloadURL = await getDownloadURL(imageRef);
      setUrl(downloadURL);

      // Save the URL to Firestore
      await addDoc(collection(db, "images"), {
        url: downloadURL,
        name: image.name,
        createdAt: new Date(),
      });
    }
  };

  useEffect(() => {
    url && alert("Upload successful!");
  }, [url]);

  return (
    <div>
      <input type="file" onChange={handleImageChange} />
      <br />
      {preview && (
        <img
          src={preview}
          alt="Image Preview"
          style={{ width: "300px", height: "300px", objectFit: "cover" }}
        />
      )}
      <br />
      <button onClick={handleUpload}>Upload</button>
      <br />
      {/* {url && <img src={url} alt="Uploaded Image" />} */}
    </div>
  );
};

export default ImageUpload;
