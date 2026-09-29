import uvicorn
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from inference import Inference

origins = [
    "http://localhost:3000"
]

class Routes:
    def __init__(self, inference : Inference):
        self.inference = inference

    def _health_check(self):
        return { "health-check": "oke" }

    def _predict(self):
        result = self.inference.run_on_holistic_result()

        return result

    def _words(self):
        words_dict = self.inference.idx_to_sign

        return [{"id": key, "word": words_dict[key]} for key in words_dict]

    def get_router(self) -> APIRouter:
        router = APIRouter()

        router.add_api_route(
            "/health",
            self._health_check,
            methods = ["GET"]
        )

        router.add_api_route(
            "/predict",
            self._predict,
            methods = ["POST"]
        )

        router.add_api_route(
            "/words",
            self._words,
            methods= ["GET"]
        )
        return router
        

class App:
    def __init__(self, db_url, http_addr = "127.0.0.1", http_port = 8080):
        self.port = http_port
        self.http_addr = http_addr
        self.db_url = db_url
        self.app = FastAPI()
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def run(self, inference):
        routes = Routes(inference)
        self.app.include_router(routes.get_router())
        uvicorn.run(self.app, port=self.port, host=self.http_addr)
        pass