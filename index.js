import sharp from 'sharp';
import alfy from 'alfy';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import debounce from 'lodash.debounce';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ip = "192.168.1.155";
const port = "1222";
const token = "C3E30353F4CA49A2821C2177BBCF7497";
const postUrl = `https://${ip}:${port}/ugreen/v1/photo/image/search/cate?token=${token}`;
const thumbsDir = path.resolve(__dirname, 'thumbs');

const specialChar = '!';

// Clear the thumbs directory
const clearThumbsDir = () => {
    if (fs.existsSync(thumbsDir)) {
        fs.readdirSync(thumbsDir).forEach(file => {
            const filePath = path.join(thumbsDir, file);
            if (fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
            }
        });
    }
};

// Function to search images
const searchImages = async (term) => {
    try {
        const requestBody = {
            content: term,
            type: 6,
        };

        const response = await axios.post(postUrl, requestBody, {
            headers: {
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/json",
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        });

        const data = response.data;
        const imageInfos = [];

        if (data.code === 200 && data.data && data.data.result) {
            const result = data.data.result;
            for (const item of result) {
                if (item.ocr_list) {
                    for (const ocr of item.ocr_list) {
                        const imageUrl = `https://${ip}:${port}/ugreen/v1/photo/streamById?token=${token}&id=${ocr.id}&file_type=1&size_type=2`;
                        const downloadUrl = `https://${ip}:${port}/ugreen/v1/filemgr/downloadFile?paths=${encodeURIComponent(ocr.file_path)}&intranet_share_id=5&token=${token}`;
                        imageInfos.push({ imageUrl, downloadUrl });
                    }
                }
            }
        }

        return imageInfos;
    } catch (error) {
        console.error("Error fetching images:", error);
        return [];
    }
};

// Function to save images using sharp
const saveImage = async (url, id) => {
    try {
        const response = await axios.get(url, {
            responseType: "arraybuffer",
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        });

        fs.mkdirSync(thumbsDir, { recursive: true });
        const fileName = `image_${id}.png`;
        const filePath = path.join(thumbsDir, fileName);

        // Save the image using sharp
        await sharp(response.data).toFile(filePath);

        return filePath;
    } catch (error) {
        console.error(`Error fetching image with ID ${id}:`, error);
        return null;
    }
};

// Function to process search requests
const processSearch = async (searchTerm) => {
    if (!searchTerm.endsWith(specialChar)) {
        alfy.output([{
            title: "Add '!' after the search term to start searching",
            subtitle: "e.g., ugreen!",
            valid: false,
            icon: {
                path: "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertStopIcon.icns"
            }
        }]);
        return;
    }

    const cleanSearchTerm = searchTerm.slice(0, -1);

    clearThumbsDir();

    const imageInfos = await searchImages(cleanSearchTerm);

    if (imageInfos.length === 0) {
        return alfy.output([{
            title: "No images found",
            subtitle: "Try a different search term.",
            valid: false,
            icon: {
                path: "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertStopIcon.icns"
            }
        }]);
    }

    const savedImages = [];
    for (let i = 0; i < imageInfos.length; i++) {
        const filePath = await saveImage(imageInfos[i].imageUrl, i);
        if (filePath) {
            savedImages.push({ filePath, downloadUrl: imageInfos[i].downloadUrl });
        }
    }

    if (savedImages.length > 0) {
        return alfy.output(savedImages.map((image, index) => ({
            title: path.basename(image.filePath),
            subtitle: image.downloadUrl,
            arg: image.downloadUrl,
            icon: { 
                path: image.filePath
            }
        })));
    } else {
        return alfy.output([{
            title: "No images saved",
            subtitle: "Error saving images.",
            valid: false,
            icon: {
                path: "/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/AlertStopIcon.icns"
            }
        }]);
    }
};

// Capture input and apply debounce
const debouncedProcessSearch = debounce(processSearch, 100);

debouncedProcessSearch(alfy.input);
