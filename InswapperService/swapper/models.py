from celery import Celery, Task, signals
from .restoration import *
from facelib.utils.face_restoration_helper import FaceRestoreHelper
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
        self.upsampler = set_realesrgan()
        self.codeformer_net = ARCH_REGISTRY.get("CodeFormer")(dim_embd=512, codebook_size=1024, n_head=8, n_layers=9, connect_list=["32", "64", "128", "256"])
        self.codeformer_net.to(self.device)
        self.codeformer_net.load_state_dict(self.checkpoint)
        self.codeformer_net.eval()

    @property
    def models(self):
        return (self.model, self.face_analyser)
     