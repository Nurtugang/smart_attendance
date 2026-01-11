from django.urls import path
from .views import LessonListAPIView, MeAPIView, MarkAttendanceAPIView, LessonQRAPIView, TeacherLessonDetailAPIView

urlpatterns = [
    path('lessons/', LessonListAPIView.as_view(), name='lesson-list'),
    path('me/', MeAPIView.as_view(), name='me'),
    path('attendance/mark/', MarkAttendanceAPIView.as_view(), name='mark-attendance'),
    path('lessons/<int:pk>/details/', TeacherLessonDetailAPIView.as_view(), name='lesson-details'),
    path('lessons/<int:pk>/qr/', LessonQRAPIView.as_view(), name='lesson-qr'),
]