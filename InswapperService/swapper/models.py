from celery import Celery, Task, signals
from .restoration import *
import insightface
import onnxruntime

class Models(Task):
    def __init__(self):
        super().__init__()
        self.ckpt_path = "CodeFormer/CodeFormer/weights/CodeFormer/codeformer.pth"
        signals.worker_init.connect(self.init_models)
        signals.worker_init.connect(self.init_device)

    def init_models(self, *args, **kwargs):
        providers = onnxruntime.get_available_providers()
        path = os.path.abspath(os.path.dirname(__file__))
        face_analyser = insightface.app.FaceAnalysis(name="buffalo_l", root='./checkpoints', providers=providers)
        face_analyser.prepare(ctx_id=0, det_size=(320, 320))
        model_path = 'checkpoints/inswapper_128.onnx'
        model = insightface.model_zoo.get_model(model_path)
        self.model = model
        self.face_analyser = face_analyser
    
    def init_device(self, *args, **kwargs):
        check_ckpts()
        device = torch.device("mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu")
        checkpoint = torch.load(self.ckpt_path)["params_ema"]
        self.checkpoint = checkpoint
        self.device = device

    @property
    def models(self):
        return (self.model, self.face_analyser)
     