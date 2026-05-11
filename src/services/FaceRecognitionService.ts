import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

class FaceRecognitionService {
  private modelsLoaded = false;
  private labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];

  async loadModels() {
    if (this.modelsLoaded) return;

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    this.modelsLoaded = true;
    console.log('Face Recognition Models Loaded');
  }

  async train(students: { id: string; name: string; imageUrl?: string }[]) {
    await this.loadModels();

    const descriptors: faceapi.LabeledFaceDescriptors[] = [];

    for (const student of students) {
      if (!student.imageUrl) continue;

      try {
        const img = await faceapi.fetchImage(student.imageUrl);
        const detections = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detections) {
          descriptors.push(new faceapi.LabeledFaceDescriptors(student.id, [detections.descriptor]));
        }
      } catch (err) {
        console.error(`Error training face for student ${student.name}:`, err);
      }
    }

    this.labeledDescriptors = descriptors;
    return descriptors.length > 0;
  }

  async recognize(videoElement: HTMLVideoElement): Promise<string | null> {
    if (this.labeledDescriptors.length === 0) return null;

    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return null;

    const faceMatcher = new faceapi.FaceMatcher(this.labeledDescriptors, 0.6);
    const result = faceMatcher.findBestMatch(detection.descriptor);

    if (result.label !== 'unknown') {
      return result.label; // Returns the student ID
    }

    return null;
  }
}

export const faceRecognitionService = new FaceRecognitionService();
