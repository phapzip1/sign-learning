"""Sign recognition with MediaPipe landmarks and a TFLite model.

Each video frame is turned into 543 landmarks (468 face, 21 left hand, 33 pose,
21 right hand; x/y/z each) by MediaPipe Holistic. The sequence of frames is fed to
the TFLite model, which scores it against 250 signs. The model was trained on
Google's Isolated Sign Language Recognition dataset (Kaggle).

Run this file directly for a webcam debugging tool: python inference.py
"""
import argparse
import json
import cv2
import numpy as np
import mediapipe as mp
from ai_edge_litert.interpreter import Interpreter

mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils

FACE_POINTS = 468
HAND_POINTS = 21
POSE_POINTS = 33
ROWS_PER_FRAME = FACE_POINTS + HAND_POINTS + POSE_POINTS + HAND_POINTS

SIGNATURE_KEY = "serving_default"
INPUT_KEY = "inputs"
OUTPUT_KEY = "outputs"

def predict(frames, prediction_fn, topk = 5):
        """Run the model on a sequence of landmark frames.

        Args:
            frames: list of (543, 3) float arrays, one per video frame.
            prediction_fn: TFLite signature runner from Inference.load_prediction_fn.
            topk: how many top-scoring sign indices to return.

        Returns:
            (scores, top_indices): the model's raw score per sign and the indices of
            the top-k signs, highest first. Returns None when frames is empty.
            The scores are not calibrated probabilities.
        """
        if len(frames) == 0:
            return

        frames_arr = np.stack(frames, axis = 0).astype(np.float32)
        output = prediction_fn(**{INPUT_KEY: frames_arr})
        probs = output[OUTPUT_KEY]
        top_indices = np.argsort(probs)[::-1][:topk]

        return probs, top_indices

def predict2(frames, prediction_fn, topk = 5):
        """Same as predict(); this duplicate is the one the rest of the code calls."""
        if len(frames) == 0:
            return

        frames_arr = np.stack(frames, axis = 0).astype(np.float32)
        output = prediction_fn(**{INPUT_KEY: frames_arr})
        probs = output[OUTPUT_KEY]
        top_indices = np.argsort(probs)[::-1][:topk]

        return probs, top_indices


class Inference:
    """Turns a video (file or webcam) into the top-k most likely signs."""
    def __init__(self, prediction_fn, idx_to_sign, topk = 5):
        """Args:
            prediction_fn: TFLite signature runner (see load_prediction_fn).
            idx_to_sign: dict mapping model output index to sign label.
            topk: unused; the value passed to the run_* methods is used instead.

        Each instance has its own MediaPipe Holistic tracker, so use one instance per video.
        """
        self.prediction_fn = prediction_fn
        self.idx_to_sign = idx_to_sign
        self.holistic = mp_holistic.Holistic(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5)


    def _landmarks_from_holistic_result(self, results):
        """Flatten one MediaPipe Holistic result into a (543, 3) array.

        Order: face, left hand, pose, right hand. A part that was not detected in the
        frame (e.g. a hand out of view) is filled with NaN, as the model expects.
        """
        def to_array(landmark_list, n_points):
            """Landmarks as an (n_points, 3) array, or all NaN when the part is missing."""
            if landmark_list is None:
                return np.full((n_points, 3), np.nan, dtype=np.float32)
            return np.array(
                [[lm.x, lm.y, lm.z] for lm in landmark_list.landmark], dtype=np.float32
            )
    
        face = to_array(results.face_landmarks, FACE_POINTS)
        lhand = to_array(results.left_hand_landmarks, HAND_POINTS)
        pose = to_array(results.pose_landmarks, POSE_POINTS)
        rhand = to_array(results.right_hand_landmarks, HAND_POINTS)
    
        return np.concatenate([face, lhand, pose, rhand], axis=0)  # (543, 3)

    def run_on_video_file(self, file_name, topk, max_frames = 150):
        """Recognise the sign in a video file.

        Args:
            file_name: path to a video OpenCV can read (e.g. WebM or MP4).
            topk: number of candidates to return.
            max_frames: unused; every frame of the file is processed.

        Returns:
            dict of sign label -> raw model score for the top-k signs, highest first.
            Labels missing from the label map appear as "Unknown:<index>".
        """
        cap = cv2.VideoCapture(filename=file_name)
        buffer = []
        while cap.isOpened():
            ok, frame = cap.read()
            if not ok:
                break
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            buffer.append(self.holistic.process(rgb))

        cap.release()
        frames = [self._landmarks_from_holistic_result(r) for r in buffer]
        probs, top_indices = predict2(frames, self.prediction_fn, topk)
        result = {}
        for i in top_indices:
            sign = self.idx_to_sign.get(int(i), f"Unknown:{i}")
            result[sign] = float(probs[i])

        return result
    
    def run_on_webcam(self, topk, max_frames = 150):
        """Interactive webcam tool for testing the model locally.

        Shows the camera with landmarks drawn. Press SPACE to start recording and SPACE
        again to stop and print the top-k signs; press Q to quit.

        Known issue: the automatic stop after max_frames calls predict2 with the wrong
        arguments and fails; stop recording with SPACE instead.
        """
        cap = cv2.VideoCapture(0)
        recording = False
        buffer = []

        window_name = "Sign recognition"

        if not cap.isOpened():
            print("Error: Could not open webcam.")
            return

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.holistic.process(rgb_frame)

            mp_drawing.draw_landmarks(frame, results.face_landmarks, mp_holistic.FACEMESH_CONTOURS)
            mp_drawing.draw_landmarks(frame, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
            mp_drawing.draw_landmarks(frame, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
            mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS)

            status, color = "Press SPACE to record a sign", (0, 200, 0)

            if recording:
                buffer.append(self._landmarks_from_holistic_result(results))
                status = f"RECORDING ({len(buffer)} frames)"
                color = (0, 0, 255)
                if len(buffer) >= max_frames:
                    probs, top_indices = predict2(buffer, self.idx_to_sign, self.prediction_fn, topk)
                    for i in top_indices:
                        sign = self.idx_to_sign.get(int(i), f"Unknown:{i}")
                        top_indices
                    buffer = []
                    recording = False

            cv2.putText(frame, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            cv2.imshow(window_name, frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord(" "):
                if recording:
                    probs, top_indices = predict2(buffer, self.prediction_fn, topk)
                    for i in top_indices:
                        sign = self.idx_to_sign.get(int(i), f"Unknown:{i}")
                        print(f"  {sign:<20s} {probs[i]:.3f}")
                        
                    buffer = []
                recording = not recording
            elif key == ord("q"):
                break

        cap.release()
        cv2.destroyAllWindows()

    @staticmethod
    def load_label_map(path):
        """Load sign_to_prediction_index_map.json and invert it to {index: sign label}."""
        with open(path, "r") as f:
            sign_to_index = json.load(f)

        return {v : k for k, v in sign_to_index.items()}

    @staticmethod
    def load_prediction_fn(model_path):
        """Load the TFLite model and return its "serving_default" signature runner.

        Raises:
            ValueError: the model has no signature named SIGNATURE_KEY.
        """
        interpreter = Interpreter(model_path = model_path)
        interpreter.allocate_tensors()
        available = list(interpreter.get_signature_list().keys())
        if SIGNATURE_KEY not in available:
            raise ValueError(
                f"Signature '{SIGNATURE_KEY}' not found in model. "
                f"Available signatures: {available}. Update SIGNATURE_KEY accordingly."
            )
        return interpreter.get_signature_runner(SIGNATURE_KEY)


def main():
    """Command-line entry point: start the webcam tool.

    Known issue: --topk and --max-frames are parsed but not used yet (5 and 150 are fixed).
    """
    parser = argparse.ArgumentParser(
        description="Run inference with an isolated sign language TFLite model."
    )


    parser.add_argument("--topk", type=int, default=5, help="Number of top predictions to print")
    parser.add_argument(
        "--max-frames",
        type=int,
        default=150,
        help="Webcam mode: auto-stop recording after this many frames",
    )

    args = parser.parse_args()
 
    idx_to_sign = Inference.load_label_map("./assets/sign_to_prediction_index_map.json")
    prediction_fn = Inference.load_prediction_fn("./assets/model.tflite")

    inference = Inference(prediction_fn, idx_to_sign)

    inference.run_on_webcam(topk=5, max_frames=150)

if __name__ == "__main__":
    main()