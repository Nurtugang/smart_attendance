import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from attendance.models import User, Group, Lesson, Attendance

class Command(BaseCommand):
    help = 'Заполняет базу расширенными тестовыми данными'

    def handle(self, *args, **kwargs):
        self.stdout.write('Полная очистка базы...')
        Attendance.objects.all().delete()
        Lesson.objects.all().delete()
        User.objects.exclude(is_superuser=True).delete()
        Group.objects.all().delete()

        # 1. Создаем группы (разные курсы и направления)
        group_names = ["CS-101", "CS-102", "IS-201", "IS-202", "AI-301"]
        groups = [Group.objects.create(name=name) for name in group_names]
        self.stdout.write(f'Создано групп: {len(groups)}')

        # 2. Создаем преподавателей
        teachers_data = [
            ('prof_matrix', 'Professor', 'Matrix'),
            ('dr_logic', 'Doctor', 'Logic'),
            ('t_expert', 'Tech', 'Expert'),
        ]
        teachers = []
        for uname, fname, lname in teachers_data:
            t = User.objects.create(
                username=uname,
                role=User.TEACHER,
                first_name=fname,
                last_name=lname
            )
            t.set_password('teacher123')
            # Привязываем каждого препода к 2-3 случайным группам
            assigned_groups = random.sample(groups, k=random.randint(2, 3))
            t.academic_groups.add(*assigned_groups)
            t.save()
            teachers.append(t)
        
        self.stdout.write(f'Создано преподавателей: {len(teachers)}')

        # 3. Создаем студентов (по 5 на каждую группу)
        students = []
        for group in groups:
            for i in range(1, 6):
                s_uname = f'student_{group.name.lower()}_{i}'
                s = User.objects.create(
                    username=s_uname,
                    role=User.STUDENT,
                    first_name=f'Student_{i}',
                    last_name=f'From_{group.name}'
                )
                s.set_password('student123')
                s.academic_groups.add(group)
                s.save()
                students.append(s)
        
        self.stdout.write(f'Создано студентов: {len(students)}')

        # 4. Создаем уроки
        now = timezone.now()
        courses = [
            "Алгоритмы и структуры данных", 
            "Архитектура систем", 
            "Базы данных", 
            "Машинное обучение", 
            "Веб-технологии"
        ]

        for i, course in enumerate(courses):
            # Распределяем уроки по времени: прошедшие, текущие, будущие
            # Урок 1: Идет прямо сейчас (для теста сканирования)
            l_active = Lesson.objects.create(
                course_name=course,
                teacher=random.choice(teachers),
                start_time=now - timedelta(minutes=20),
                end_time=now + timedelta(minutes=70)
            )
            l_active.lesson_groups.add(random.choice(groups))

            # Урок 2: Был вчера (для истории)
            l_past = Lesson.objects.create(
                course_name=f"{course} (Лекция)",
                teacher=random.choice(teachers),
                start_time=now - timedelta(days=1, hours=2),
                end_time=now - timedelta(days=1)
            )
            l_past.lesson_groups.add(*random.sample(groups, k=2)) # Потоковая лекция
            
        self.stdout.write('Генерация уроков завершена')

        self.stdout.write(self.style.SUCCESS('--- База данных успешно наполнена ---'))