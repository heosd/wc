# ViewCoord class
- A x, y : view box 용 좌표
- B w, h : 실제 표현용 크기
- ratio : 비율, 1은 원래 비율, 0.5는 50%
- svg의 style width height를 읽어서 B w h로 설정
- ratio 구간 설정
- ratio에 따른 Ax Ay 값 계산을 위함

# Background Image
- svg 테그 안에 그림을 넣는다. image 등
- viewBox 를 이동 하여 위치와 비율을 조절 한다.

# Position
- BMove, BDown - mouse move, down offset X Y
- AMove, ADown - mouse move, down imageXY(offset X, Y)
- A는 view box 내의 좌표
- B는 화면상 offset 좌표
- 두 값은 항상 기록 된다.

# Drag ViewBox
- down : selectedDrag = true
- move : x = move - down, setViewBox raw
- up : getViewBox -> coord.A(x, y)
- move 에서 직접 coord.A로 viewBox를 계산하면 값이 시작점을 잃고 계속 증폭된다.
- move 에서 상대 위치만 계속 바꾸며 직접 viewBox 를 바꾸고, up 일때 그 값을 coord에 확정한다.

# Create
- createUserRect : lastCreatedRect = new Rect()
- move : width, height
- up : dismiss

# Drag Rect
- down : selectedRect = find xywh rect, selectedRectCursor = x, y
- move : x - selectedRectCursor
- up : dismiss

# Drag Rect Size
- down : selectedRectSize = find xywh rect, attribute data-wdown data-hdown
- move : wdown + (move - down)
- up : dismiss
