import qrcode
from io import BytesIO

from django.http import HttpResponse

from attendance.serializers import LessonDetailTeacherSerializer
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Attendance, Lesson, User
from .serializers import LessonSerializer, UserSerializer

from rest_framework.permissions import IsAuthenticated

class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # request.user — это объект текущего пользователя, вычисленный из JWT
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
class LessonListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Если учитель — видит только те уроки, где он назначен преподавателем
        if user.role == User.TEACHER:
            lessons = Lesson.objects.filter(teacher=user)
        
        # Если студент — видит только уроки для его групп
        elif user.role == User.STUDENT:
            lessons = Lesson.objects.filter(lesson_groups__in=user.academic_groups.all()).distinct()
        
        else:
            lessons = Lesson.objects.none()

        # Сортируем: сначала самые свежие
        lessons = lessons.order_by('-start_time')
        
        serializer = LessonSerializer(lessons, many=True, context={'request': request})
        return Response(serializer.data)
    
class MarkAttendanceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != User.STUDENT:
            return Response({"error": "Только студенты могут отмечать посещаемость"}, status=status.HTTP_403_FORBIDDEN)
        
        qr_token = request.data.get('qr_token')
        device_id = request.data.get('device_id')
        student = request.user

        # 1. Проверка существования урока
        try:
            lesson = Lesson.objects.get(qr_token=qr_token)
        except Lesson.DoesNotExist:
            return Response({"error": "Некорректный QR-код"}, status=status.HTTP_404_NOT_FOUND)

        # 2. Проверка: идет ли урок сейчас?
        if not lesson.is_active:
            return Response({"error": "Урок уже закончился или еще не начался"}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Проверка: этот студент вообще из той группы?
        student_groups = student.academic_groups.all()
        # Проверяем пересечение групп студента и групп урока
        if not lesson.lesson_groups.filter(id__in=student_groups).exists():
            return Response({"error": "Вы не прикреплены к этому уроку"}, status=status.HTTP_403_FORBIDDEN)

        # 4. Проверка на дубликат (Студент уже отмечался?)
        if Attendance.objects.filter(student=student, lesson=lesson).exists():
            return Response({"error": "Вы уже отметились на этом уроке"}, status=status.HTTP_400_BAD_REQUEST)

        # 5. Анти-фрод: Использовался ли этот девайс другим студентом на этом уроке?
        if Attendance.objects.filter(lesson=lesson, device_id=device_id).exclude(student=student).exists():
            return Response({"error": "С этого устройства уже отметился другой студент"}, status=status.HTTP_400_BAD_REQUEST)

        # 6. Если всё ок — создаем запись
        Attendance.objects.create(
            student=student,
            lesson=lesson,
            device_id=device_id
        )

        return Response({"success": "Посещение успешно отмечено!"}, status=status.HTTP_201_CREATED)
    
class LessonQRAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.role != User.ADMIN:
            return Response(
                {"error": "Доступ запрещен. QR-код может видеть только администратор."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            lesson = Lesson.objects.get(pk=pk)
        except Lesson.DoesNotExist:
            return Response({"error": "Урок не найден"}, status=status.HTTP_404_NOT_FOUND)

        # qrcode.make создает PIL изображение на основе строки токена
        img = qrcode.make(lesson.qr_token)

        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        return HttpResponse(buffer.getvalue(), content_type="image/png")

class TeacherLessonDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.role != User.TEACHER:
            return Response({"error": "Только для преподавателей"}, status=403)
        
        try:
            lesson = Lesson.objects.get(pk=pk, teacher=request.user)
            serializer = LessonDetailTeacherSerializer(lesson, context={'request': request})
            return Response(serializer.data)
        except Lesson.DoesNotExist:
            return Response({"error": "Урок не найден"}, status=404)