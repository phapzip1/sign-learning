import argparse

from app import App
from inference import Inference

def main():
    prediction_fn = Inference.load_prediction_fn("./assets/model.tflite")
    labels = Inference.load_label_map("./assets/sign_to_prediction_index_map.json")
    inference = Inference(prediction_fn=prediction_fn, idx_to_sign=labels)

    app = App("")

    app.run(inference)

if __name__ == "__main__":
    main()